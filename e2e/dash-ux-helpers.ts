import { expect, type Locator, type Page } from '@playwright/test'
import { delete_button_in_completed_row } from './dash-completed-row-delete'
import { try_seed_open_tasks_via_api } from './dash-seed-open-tasks-api'
import {
	clear_dash_filters,
	DASH_READY_TIMEOUT_MS,
	goto_dash,
	goto_done_tab_ja,
	reset_dash_search_ui,
	testid,
} from './dash-ux-navigation'
import { purge_saved_task_by_title } from './dash-ux-purge-by-title'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

const TASK_CARD_ATTR = 'data-dash-task-card'
const INLINE_EDITOR_OPEN_TIMEOUT_MS = 30_000
const CREATE_RESPONSE_WAIT_MS = 12_000
const COMPLETE_RESPONSE_WAIT_MS = 12_000
const CLEANUP_API_PATH = '/api/test/cleanup-tasks'
const empty_title_purge_max_passes = 15

async function blur_inline_editor(page: Page): Promise<void> {
	await page.getByTestId(testid.search).click()
}

async function discard_open_draft_inline(page: Page): Promise<void> {
	const inline = page.getByTestId(testid.inline_title)

	if ((await inline.count()) === 0) return

	const first = inline.first()
	if (!(await first.isVisible())) return

	const draft = await first.inputValue().catch(() => '')
	if (draft.trim() !== '') return

	await first.fill('')
	await blur_inline_editor(page)
	await expect(inline).toHaveCount(0, { timeout: DASH_READY_TIMEOUT_MS })
}

async function open_new_task_editor(page: Page): Promise<void> {
	await discard_open_draft_inline(page)
	const add = page.getByTestId(testid.add_task)
	const create_response = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/create') &&
			response.ok(),
		{ timeout: CREATE_RESPONSE_WAIT_MS },
	)

	await add.click()

	try {
		await create_response
	} catch {
		/* Quick-add pulse path may not POST. */
	}

	await expect(page.getByTestId(testid.inline_title)).toBeVisible({
		timeout: INLINE_EDITOR_OPEN_TIMEOUT_MS,
	})
}

async function expect_task_title_buttons(page: Page, titles: Array<string>): Promise<void> {
	for (const title of titles) {
		await expect(page.getByRole('button', { name: title })).toBeVisible({
			timeout: DASH_READY_TIMEOUT_MS,
		})
	}
}

async function save_new_task(page: Page, title: string): Promise<void> {
	const did_seed = await try_seed_open_tasks_via_api(page, [title])

	if (did_seed) {
		await goto_dash(page)
		await clear_dash_filters(page)
		await expect(page.getByRole('button', { name: title })).toBeVisible({
			timeout: DASH_READY_TIMEOUT_MS,
		})

		return
	}

	await open_new_task_editor(page)
	await page.getByTestId(testid.inline_title).fill(title)
	await blur_inline_editor(page)
	await expect(page.getByRole('button', { name: title })).toBeVisible({
		timeout: DASH_READY_TIMEOUT_MS,
	})
}

async function seed_tasks_via_ui(page: Page, titles: Array<string>): Promise<void> {
	for (const title of titles) {
		await open_new_task_editor(page)
		await page.getByTestId(testid.inline_title).fill(title)
		await blur_inline_editor(page)
		await expect(page.getByTestId(testid.inline_title)).toHaveCount(0, {
			timeout: DASH_READY_TIMEOUT_MS,
		})
		await expect(page.getByRole('button', { name: title })).toBeVisible({
			timeout: DASH_READY_TIMEOUT_MS,
		})
	}
}

/**
 * Creates multiple tasks in a single page visit.
 * Use instead of repeated `save_new_task` calls to avoid redundant `goto_dash` per task.
 */
async function seed_tasks(page: Page, titles: Array<string>): Promise<void> {
	const did_seed = await try_seed_open_tasks_via_api(page, titles)

	if (did_seed) {
		await goto_dash(page)
		await clear_dash_filters(page)
		await expect_task_title_buttons(page, titles)

		return
	}

	await seed_tasks_via_ui(page, titles)
}

async function complete_task_by_text(page: Page, run_id: string): Promise<void> {
	const complete_response = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/complete') &&
			response.ok(),
		{ timeout: COMPLETE_RESPONSE_WAIT_MS },
	)

	await page
		.getByTestId(testid.task_row)
		.filter({ hasText: run_id })
		.getByTestId(testid.complete)
		.click()
	await complete_response
}

async function inline_title_via_button(
	page: Page,
	title_text: string,
	expected_value: string,
): Promise<void> {
	const title_button = page.getByRole('button', { name: title_text })

	await expect(title_button).toBeVisible({ timeout: DASH_READY_TIMEOUT_MS })
	const task_card_id = await title_button.getAttribute('data-task-id')

	expect(task_card_id).toBeTruthy()
	await title_button.click()
	await expect(
		page.locator(`[${TASK_CARD_ATTR}="${String(task_card_id)}"]`).getByTestId(testid.inline_title),
	).toHaveValue(expected_value)
}

async function discard_empty_inline_if_open(page: Page): Promise<void> {
	const inline = page.getByTestId(testid.inline_title)
	if ((await inline.count()) === 0) return

	await inline.fill('')
	await blur_inline_editor(page)
	await expect(inline).toHaveCount(0)
}

async function is_visible_empty_title_button(title_button: Locator): Promise<boolean> {
	if ((await title_button.count()) === 0) return false
	if (!(await title_button.isVisible())) return false
	const text = (await title_button.textContent()) ?? ''

	return text.trim() === ''
}

async function find_empty_title_button(
	rows: Locator,
	row_count: number,
): Promise<Locator | undefined> {
	for (let index = 0; index < row_count; index++) {
		const title_button = rows.nth(index).locator('[data-dash-task-title]')
		if (await is_visible_empty_title_button(title_button)) return title_button
	}

	return undefined
}

async function discard_empty_open_row(page: Page, title_button: Locator): Promise<void> {
	await title_button.scrollIntoViewIfNeeded()
	await title_button.click()
	await expect(page.getByTestId(testid.inline_title)).toBeVisible()
	await page.getByTestId(testid.inline_title).fill('')
	await blur_inline_editor(page)
}

async function discard_empty_row_once(page: Page): Promise<boolean> {
	await goto_dash(page)
	await discard_empty_inline_if_open(page)
	const rows = page.getByTestId(testid.task_row)
	const row_count = await rows.count()
	const title_button = await find_empty_title_button(rows, row_count)

	if (title_button === undefined) return false

	await discard_empty_open_row(page, title_button)

	return true
}

async function purge_empty_title_open_tasks(page: Page): Promise<void> {
	for (let pass = 0; pass < empty_title_purge_max_passes; pass++) {
		const did_purge = await discard_empty_row_once(page)
		if (!did_purge) return
	}
}

async function ui_cleanup_dash_created_tasks(
	page: Page,
	purge_titles: Array<string>,
): Promise<void> {
	await reset_dash_search_ui(page)

	for (const title of purge_titles) {
		await purge_saved_task_by_title(page, title)
	}

	await purge_empty_title_open_tasks(page)
	await discard_empty_inline_if_open(page)
}

async function try_api_cleanup(page: Page, titles: Array<string>): Promise<boolean> {
	try {
		const response = await page.request.post(CLEANUP_API_PATH, { data: { titles } })

		return response.ok()
	} catch {
		return false
	}
}

async function cleanup_dash_created_tasks(page: Page, purge_titles: Array<string>): Promise<void> {
	// Skip API cleanup when no titles: avoids global teardown that would delete other workers' tasks.
	if (purge_titles.length > 0) {
		const is_api_ok = await try_api_cleanup(page, purge_titles)

		if (is_api_ok) return
	}

	await ui_cleanup_dash_created_tasks(page, purge_titles)
}

async function run_authed(
	page: Page,
	body: () => Promise<void>,
	purge_titles: Array<string> = [],
): Promise<void> {
	try {
		await body()
	} finally {
		await cleanup_dash_created_tasks(page, purge_titles)
	}
}

export const playwright_dash_ux = {
	auth_storage_path: SAVED_AUTH_STORAGE.FILE_PATH,
	testid,
	run_authed,
	goto_dash,
	goto_done_tab_ja,
	reset_dash_search_ui,
	clear_dash_filters,
	open_new_task_editor,
	blur_inline_editor,
	save_new_task,
	seed_tasks,
	complete_task_by_text,
	inline_title_via_button,
	delete_done_button_in_row: delete_button_in_completed_row,
}
