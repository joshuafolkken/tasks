import { expect, type Locator, type Page } from '@playwright/test'
import { DASH_JA_PAGE_HEADING } from './dash-ja-strings'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

const DASH_GOTO_TIMEOUT_MS = 25_000
const DASH_READY_TIMEOUT_MS = 15_000
const TASK_CARD_ATTR = 'data-dash-task-card'
/** `begin_add_at_top` posts `?/create` then `invalidateAll()` — inline row can lag behind `load`. */
const INLINE_EDITOR_OPEN_TIMEOUT_MS = 30_000
const NET_IDLE_GRACE_MS = 8000
/** Pulse-only quick-add path may not POST — do not block `open_new_task_editor` for the full inline timeout. */
const CREATE_RESPONSE_WAIT_MS = 12_000
const dash_ja_route = '/ja/dash'
const empty_title_purge_max_passes = 15
/** Recurring tasks may re-open the same title on the active list after each complete. */
const RECURRENCE_PURGE_MAX_PASSES = 15
const DONE_DELETE_CLICK_MS = 20_000

const testid = {
	add_task: 'dash-add-task-label',
	inline_title: 'dash-inline-title-input',
	inline_label_input: 'dash-inline-label-input',
	search: 'dash-search-input',
	task_row: 'dash-task-row',
	complete: 'dash-task-complete-button',
	delete_completed: 'dash-task-delete-completed-button',
	filter_mode: 'dash-filter-mode-toggle',
	filter_clear_labels: 'dash-filter-clear-labels',
	recurrence_dialog: 'dash-recurrence-dialog',
} as const

/** `dash_task_delete_aria` in messages (en, ja, km, uz) — fallback when older bundles lack `data-testid`. */
/* cspell:disable -- copied verbatim from Paraglide `messages` (km, uz) */
const COMPLETED_DELETE_ARIA_LABELS = [
	'Delete this completed task permanently',
	'完了済みタスクを完全に削除',
	'លុបកិច្ចការដែលបានបញ្ចប់ជាអចិន្ត្រៃយ៍',
	"Ushbu bajarilgan vazifani butunlay o'chirish",
] as const
/* cspell:enable */

const REGEXP_META_CHARS = /[$()*+.?[\\\]^{|}]/gu

function escape_regexp(text: string): string {
	return text.replaceAll(REGEXP_META_CHARS, (ch) => `\\${ch}`)
}

function delete_button_in_completed_row(completed_row: Locator): Locator {
	const by_testid = completed_row.getByTestId(testid.delete_completed)
	const pattern = new RegExp(
		COMPLETED_DELETE_ARIA_LABELS.map((label) => escape_regexp(label)).join('|'),
		'u',
	)
	const by_aria = completed_row.getByRole('button', { name: pattern })

	return by_testid.or(by_aria)
}

async function goto_dash(page: Page): Promise<void> {
	/* `load` alone can resolve before Svelte hydrates; anchor on heading + primary control. */
	await page.goto(dash_ja_route, { waitUntil: 'load', timeout: DASH_GOTO_TIMEOUT_MS })
	await expect(page.getByRole('heading', { level: 1, name: DASH_JA_PAGE_HEADING })).toBeVisible({
		timeout: DASH_READY_TIMEOUT_MS,
	})
	await expect(page.getByTestId(testid.add_task)).toBeVisible({ timeout: DASH_READY_TIMEOUT_MS })

	try {
		await page.waitForLoadState('networkidle', { timeout: NET_IDLE_GRACE_MS })
	} catch {
		/* Vite dev may never reach networkidle. */
	}
}

async function goto_done_tab_ja(page: Page): Promise<void> {
	await page.goto(`${dash_ja_route}?done=1`, {
		waitUntil: 'load',
		timeout: DASH_GOTO_TIMEOUT_MS,
	})
	await expect(page.getByTestId(testid.search)).toBeVisible({ timeout: DASH_READY_TIMEOUT_MS })
}

async function clear_dash_filters(page: Page): Promise<void> {
	const clear_button = page.getByTestId(testid.filter_clear_labels)
	if (await clear_button.isVisible()) await clear_button.click()
	const mode_toggle = page.getByTestId(testid.filter_mode)
	const mode_raw = await mode_toggle.textContent()
	const mode_label = (mode_raw ?? '').trim()

	// Cycle is ONE → AND → OR → ONE. Reset to ONE.
	if (mode_label === 'OR') await mode_toggle.click()

	if (mode_label === 'AND') {
		await mode_toggle.click()
		await mode_toggle.click()
	}

	await page.getByTestId(testid.search).fill('')
}

async function reset_dash_search_ui(page: Page): Promise<void> {
	await goto_dash(page)
	await clear_dash_filters(page)
}

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

async function save_new_task(page: Page, title: string): Promise<void> {
	await goto_dash(page)
	await open_new_task_editor(page)
	await page.getByTestId(testid.inline_title).fill(title)
	await blur_inline_editor(page)
	await expect(page.getByRole('button', { name: title })).toBeVisible({
		timeout: DASH_READY_TIMEOUT_MS,
	})
}

async function complete_task_by_text(page: Page, run_id: string): Promise<void> {
	await page
		.getByTestId(testid.task_row)
		.filter({ hasText: run_id })
		.getByTestId(testid.complete)
		.click()
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

async function complete_open_row_if_visible(page: Page, title: string): Promise<boolean> {
	await goto_dash(page)
	const title_button = page.getByRole('button', { name: title })

	if ((await title_button.count()) === 0) return false

	await page
		.getByTestId(testid.task_row)
		.filter({ hasText: title })
		.first()
		.getByTestId(testid.complete)
		.click()

	return true
}

async function purge_open_tasks_by_title(page: Page, title: string): Promise<void> {
	for (let attempt = 0; attempt < RECURRENCE_PURGE_MAX_PASSES; attempt++) {
		const did_complete = await complete_open_row_if_visible(page, title)
		if (!did_complete) return
	}
}

async function purge_done_tasks_by_title(page: Page, title: string): Promise<void> {
	for (let attempt = 0; attempt < RECURRENCE_PURGE_MAX_PASSES; attempt++) {
		const completed_rows = page.getByTestId(testid.task_row).filter({ hasText: title })
		const row_count = await completed_rows.count()
		if (row_count === 0) return

		await delete_button_in_completed_row(completed_rows.nth(0)).click({
			force: true,
			timeout: DONE_DELETE_CLICK_MS,
		})

		await expect(completed_rows).toHaveCount(row_count - 1, { timeout: DONE_DELETE_CLICK_MS })
	}
}

async function purge_saved_task_by_title(page: Page, title: string): Promise<void> {
	await purge_open_tasks_by_title(page, title)
	await goto_done_tab_ja(page)
	await purge_done_tasks_by_title(page, title)
}

async function cleanup_dash_created_tasks(page: Page, purge_titles: Array<string>): Promise<void> {
	await reset_dash_search_ui(page)

	for (const title of purge_titles) {
		await purge_saved_task_by_title(page, title)
	}

	await purge_empty_title_open_tasks(page)
	await discard_empty_inline_if_open(page)
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
	complete_task_by_text,
	inline_title_via_button,
	delete_done_button_in_row: delete_button_in_completed_row,
}
