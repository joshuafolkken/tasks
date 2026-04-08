import { expect, type Locator, type Page } from '@playwright/test'
import { playwright_dash_ux } from './dash-ux-helpers'

/** Tasks are user-scoped; scrubbing and asserting on `ja` alone covers all locales. */
const APP_LOCALES = ['ja'] as const
const AUTOMATION_TITLE_SNIPPET = 'E2E_'
const SCRUB_MAX_PASSES = 120
const SCRUB_ROW_HIDE_TIMEOUT_MS = 20_000
const LEAK_GOTO_TIMEOUT_MS = 30_000
const LEAK_DASH_READY_TIMEOUT_MS = 15_000
const DELETE_RESPONSE_MS = 20_000
const TASK_CARD = 'data-dash-task-card'
const TASK_TITLE = 'data-dash-task-title'
const SVELTEKIT_JSON_HEADERS = {
	accept: 'application/json',
	'x-sveltekit-action': 'true',
} as const

const tid = playwright_dash_ux.testid

/** `networkidle` flakes when long-lived connections keep the page "busy" after other E2E tests. */
async function goto_dash_ready(page: Page, dash_path: string): Promise<void> {
	await page.goto(dash_path, { waitUntil: 'load', timeout: LEAK_GOTO_TIMEOUT_MS })
	await expect(page.getByTestId(tid.search)).toBeVisible({ timeout: LEAK_DASH_READY_TIMEOUT_MS })
	await playwright_dash_ux.clear_dash_filters(page)
}

function row_locator_by_card_id(page: Page, card_id: string): Locator {
	return page.locator(`[${TASK_CARD}="${card_id}"]`)
}

async function automation_row_still_visible(page: Page, card_id: string): Promise<boolean> {
	const row = row_locator_by_card_id(page, card_id)
	if ((await row.count()) === 0) return false

	return (await row.filter({ hasText: AUTOMATION_TITLE_SNIPPET }).count()) > 0
}

async function open_row_still_exists(page: Page, card_id: string): Promise<boolean> {
	return (await row_locator_by_card_id(page, card_id).count()) > 0
}

async function try_wait_row_visible(row: Locator, timeout_ms: number): Promise<boolean> {
	try {
		await row.waitFor({ state: 'visible', timeout: timeout_ms })
	} catch {
		return false
	}

	return await row.isVisible()
}

async function delete_done_row_for_card(page: Page, card_id: string): Promise<void> {
	const row_by_id = row_locator_by_card_id(page, card_id)
	const delete_response = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/delete_completed') &&
			response.ok(),
		{ timeout: DELETE_RESPONSE_MS },
	)

	await playwright_dash_ux.delete_done_button_in_row(row_by_id).click()
	await delete_response
	await expect(row_by_id).toBeHidden({ timeout: SCRUB_ROW_HIDE_TIMEOUT_MS })
}

async function try_delete_one_done_row(page: Page, locale: string): Promise<boolean> {
	await goto_dash_ready(page, `/${locale}/dash?done=1`)
	const rows = page.getByTestId(tid.task_row).filter({ hasText: AUTOMATION_TITLE_SNIPPET })

	if ((await rows.count()) === 0) return false

	const row = rows.first()

	if (!(await try_wait_row_visible(row, LEAK_DASH_READY_TIMEOUT_MS))) return false

	const card_id = await row.getAttribute(TASK_CARD)
	if (card_id === null || card_id === '') return false

	await delete_done_row_for_card(page, card_id)

	return true
}

async function api_discard_open_task(page: Page, base_url: string, card_id: string): Promise<void> {
	await page.request.post(`${base_url}?/update_task`, {
		headers: SVELTEKIT_JSON_HEADERS,
		form: { task_id: card_id, title: '', detail: '', due_date: '', recurrence_rule: '' },
	})
	await page.request.post(`${base_url}?/discard_empty_open_task`, {
		headers: SVELTEKIT_JSON_HEADERS,
		form: { task_id: card_id },
	})
}

async function post_discard_reload(page: Page, dash_path: string, card_id: string): Promise<void> {
	await api_discard_open_task(page, page.url(), card_id)
	await goto_dash_ready(page, dash_path)
}

async function discard_automation_verified(
	page: Page,
	dash_path: string,
	card_id: string,
): Promise<boolean> {
	await post_discard_reload(page, dash_path, card_id)

	return !(await automation_row_still_visible(page, card_id))
}

async function get_title_text(row: Locator): Promise<string | undefined> {
	const title_button = row.locator(`[${TASK_TITLE}]`)
	if ((await title_button.count()) === 0) return undefined
	if (!(await title_button.isVisible())) return undefined

	return ((await title_button.textContent()) ?? '').trim()
}

async function try_get_empty_row_card_id(row: Locator): Promise<string | undefined> {
	const text = await get_title_text(row)
	if (text === undefined || text !== '') return undefined

	const card_id = await row.getAttribute(TASK_CARD)
	if (card_id === null || card_id === '') return undefined

	return card_id
}

async function find_empty_title_row_id(page: Page): Promise<string | undefined> {
	const rows = page.getByTestId(tid.task_row)
	const row_count = await rows.count()

	for (let index = 0; index < row_count; index++) {
		const card_id = await try_get_empty_row_card_id(rows.nth(index))
		if (card_id !== undefined) return card_id
	}

	return undefined
}

async function try_discard_one_empty_open_row(page: Page, locale: string): Promise<boolean> {
	const dash_path = `/${locale}/dash`

	await goto_dash_ready(page, dash_path)
	const card_id = await find_empty_title_row_id(page)
	if (card_id === undefined) return false

	await post_discard_reload(page, dash_path, card_id)

	return !(await open_row_still_exists(page, card_id))
}

async function try_discard_one_open_row(page: Page, locale: string): Promise<boolean> {
	const dash_path = `/${locale}/dash`

	await goto_dash_ready(page, dash_path)
	const rows = page.getByTestId(tid.task_row).filter({ hasText: AUTOMATION_TITLE_SNIPPET })

	if ((await rows.count()) === 0) return false

	const row = rows.first()

	if (!(await try_wait_row_visible(row, LEAK_DASH_READY_TIMEOUT_MS))) return false

	const card_id = await row.getAttribute(TASK_CARD)
	if (card_id === null || card_id === '') return false

	return await discard_automation_verified(page, dash_path, card_id)
}

async function scrub_one_pass_locale(page: Page, locale: string): Promise<boolean> {
	const did_delete = await try_delete_one_done_row(page, locale)
	if (did_delete) return true

	const did_discard = await try_discard_one_open_row(page, locale)
	if (did_discard) return true

	return await try_discard_one_empty_open_row(page, locale)
}

async function scrub_locale_until_clean(page: Page, locale: string): Promise<void> {
	for (let pass = 0; pass < SCRUB_MAX_PASSES; pass++) {
		const did_mutate = await scrub_one_pass_locale(page, locale)
		if (!did_mutate) return
	}
}

async function scrub_every_locale(page: Page): Promise<void> {
	for (const locale of APP_LOCALES) {
		await scrub_locale_until_clean(page, locale)
	}
}

async function assert_no_automation_task_rows(page: Page, dash_path: string): Promise<void> {
	const leaking_rows = page.getByTestId(tid.task_row).filter({ hasText: AUTOMATION_TITLE_SNIPPET })

	await expect(leaking_rows, `Unexpected E2E_* tasks at ${dash_path}`).toHaveCount(0)
}

async function assert_no_empty_title_rows(page: Page, dash_path: string): Promise<void> {
	const first_empty_id = await find_empty_title_row_id(page)

	expect(first_empty_id, `Unexpected empty-title task at ${dash_path}`).toBeUndefined()
}

async function assert_locale_clean(page: Page, locale: string): Promise<void> {
	const open_path = `/${locale}/dash`
	const done_path = `/${locale}/dash?done=1`

	await goto_dash_ready(page, open_path)
	await assert_no_automation_task_rows(page, open_path)
	await assert_no_empty_title_rows(page, open_path)

	await goto_dash_ready(page, done_path)
	await assert_no_automation_task_rows(page, done_path)
}

async function assert_every_locale_clean(page: Page): Promise<void> {
	for (const locale of APP_LOCALES) {
		await assert_locale_clean(page, locale)
	}
}

async function try_api_cleanup(page: Page): Promise<boolean> {
	try {
		const response = await page.request.post('/api/test/cleanup-tasks')

		return response.ok()
	} catch {
		return false
	}
}

/** Removes tasks whose title contains `E2E_`, then asserts none remain. */
async function scrub_then_assert_clean(page: Page): Promise<void> {
	const is_api_ok = await try_api_cleanup(page)

	if (!is_api_ok) await scrub_every_locale(page)
	await assert_every_locale_clean(page)
}

export const dash_leak_guard = {
	scrub_then_assert_clean,
}
