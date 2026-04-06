import { expect, type Locator, type Page } from '@playwright/test'
import { playwright_dash_ux } from './dash-ux-helpers'

const APP_LOCALES = ['en', 'ja', 'km', 'uz'] as const
const AUTOMATION_TITLE_SNIPPET = 'E2E_'
const SCRUB_MAX_PASSES = 120
const SCRUB_ROW_HIDE_TIMEOUT_MS = 20_000
const LEAK_GOTO_TIMEOUT_MS = 30_000
const LEAK_DASH_READY_TIMEOUT_MS = 15_000
const DELETE_RESPONSE_MS = 20_000
const TASK_CARD = 'data-dash-task-card'

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

const DISMISS_INLINE_TIMEOUT_MS = 8000

async function dismiss_inline_in_row_if_open(page: Page, row: Locator): Promise<void> {
	const inline = row.getByTestId(tid.inline_title)
	if ((await inline.count()) === 0) return
	if (!(await inline.isVisible())) return

	await inline.click()
	await page.keyboard.press('Escape')

	try {
		await expect(inline).toBeHidden({ timeout: DISMISS_INLINE_TIMEOUT_MS })
	} catch {
		/* View mode may swap the control without hiding the same node; still try complete. */
	}
}

async function complete_open_row_for_card(page: Page, card_id: string): Promise<void> {
	const row_by_id = row_locator_by_card_id(page, card_id)

	await dismiss_inline_in_row_if_open(page, row_by_id)
	await row_by_id.getByTestId(tid.complete).click()
	await expect(row_by_id).toBeHidden({ timeout: SCRUB_ROW_HIDE_TIMEOUT_MS })
}

async function try_complete_one_open_row(page: Page, locale: string): Promise<boolean> {
	await goto_dash_ready(page, `/${locale}/dash`)
	const rows = page.getByTestId(tid.task_row).filter({ hasText: AUTOMATION_TITLE_SNIPPET })

	if ((await rows.count()) === 0) return false

	const row = rows.first()

	if (!(await try_wait_row_visible(row, LEAK_DASH_READY_TIMEOUT_MS))) return false

	const card_id = await row.getAttribute(TASK_CARD)
	if (card_id === null || card_id === '') return false

	await complete_open_row_for_card(page, card_id)

	return true
}

async function scrub_one_pass_locale(page: Page, locale: string): Promise<boolean> {
	const did_delete = await try_delete_one_done_row(page, locale)
	if (did_delete) return true

	return await try_complete_one_open_row(page, locale)
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

async function assert_locale_clean(page: Page, locale: string): Promise<void> {
	const paths = [`/${locale}/dash`, `/${locale}/dash?done=1`] as const

	for (const dash_path of paths) {
		await goto_dash_ready(page, dash_path)
		const leaking_rows = page
			.getByTestId(tid.task_row)
			.filter({ hasText: AUTOMATION_TITLE_SNIPPET })

		await expect(leaking_rows, `Unexpected E2E_* tasks at ${dash_path}`).toHaveCount(0)
	}
}

async function assert_every_locale_clean(page: Page): Promise<void> {
	for (const locale of APP_LOCALES) {
		await assert_locale_clean(page, locale)
	}
}

/** Removes tasks whose title contains `E2E_`, then asserts none remain. */
async function scrub_then_assert_clean(page: Page): Promise<void> {
	await scrub_every_locale(page)
	await assert_every_locale_clean(page)
}

export const dash_leak_guard = {
	scrub_then_assert_clean,
}
