import { expect, type Page } from '@playwright/test'
import { DASH_JA_PAGE_HEADING } from './dash-ja-strings'

const DASH_GOTO_TIMEOUT_MS = 25_000
const DASH_READY_TIMEOUT_MS = 15_000
// Vite dev server rarely reaches networkidle; keep timeout short so it fails fast.
// CI uses a preview server where networkidle is reliably reached, so a longer grace is fine.
const NET_IDLE_GRACE_DEV_MS = 1000
const NET_IDLE_GRACE_CI_MS = 2000
const is_ci = Boolean(process.env['CI'])
const NET_IDLE_GRACE_MS = is_ci ? NET_IDLE_GRACE_CI_MS : NET_IDLE_GRACE_DEV_MS
const DASH_JA_ROUTE = '/ja/dash'

const testid = {
	add_task: 'dash-add-task-label',
	inline_title: 'dash-inline-title-input',
	inline_label_input: 'dash-inline-label-input',
	inline_editor_slide_wrapper: 'dash-inline-editor-slide-wrapper',
	search: 'dash-search-input',
	task_row: 'dash-task-row',
	complete: 'dash-task-complete-button',
	delete_completed: 'dash-task-delete-completed-button',
	filter_mode: 'dash-filter-mode-toggle',
	filter_clear_labels: 'dash-filter-clear-labels',
	recurrence_dialog: 'dash-recurrence-dialog',
} as const

async function goto_dash(page: Page): Promise<void> {
	await page.goto(DASH_JA_ROUTE, { waitUntil: 'load', timeout: DASH_GOTO_TIMEOUT_MS })
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
	await page.goto(`${DASH_JA_ROUTE}?done=1`, {
		waitUntil: 'load',
		timeout: DASH_GOTO_TIMEOUT_MS,
	})
	await expect(page.getByTestId(testid.search)).toBeVisible({ timeout: DASH_READY_TIMEOUT_MS })
}

async function reset_filter_mode(page: Page): Promise<void> {
	const mode_toggle = page.getByTestId(testid.filter_mode)
	const mode_label = ((await mode_toggle.textContent()) ?? '').trim()

	if (mode_label === 'OR') await mode_toggle.click()

	if (mode_label === 'AND') {
		await mode_toggle.click()
		await mode_toggle.click()
	}
}

async function clear_dash_filters(page: Page): Promise<void> {
	const clear_button = page.getByTestId(testid.filter_clear_labels)

	if (await clear_button.isVisible()) await clear_button.click()

	await reset_filter_mode(page)
	await page.getByTestId(testid.search).fill('')
}

async function reset_dash_search_ui(page: Page): Promise<void> {
	await goto_dash(page)
	await clear_dash_filters(page)
}

export {
	testid,
	DASH_JA_ROUTE,
	DASH_GOTO_TIMEOUT_MS,
	DASH_READY_TIMEOUT_MS,
	goto_dash,
	goto_done_tab_ja,
	clear_dash_filters,
	reset_dash_search_ui,
}
