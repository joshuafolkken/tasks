import { expect, type Page } from '@playwright/test'
import { delete_button_in_completed_row } from './dash-completed-row-delete'
import { goto_dash, goto_done_tab_ja, testid } from './dash-ux-navigation'

const RECURRENCE_PURGE_MAX_PASSES = 15
const DONE_DELETE_CLICK_MS = 20_000

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

export { purge_saved_task_by_title }
