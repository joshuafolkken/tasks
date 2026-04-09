import { existsSync } from 'node:fs'
import { playwright_dash_ux } from './dash-ux-helpers'
import { expect, test, type Page } from './worker-fixtures'

const tid = playwright_dash_ux.testid
const REORDER_RESPONSE_TIMEOUT_MS = 12_000
const DASH_ROW_READY_TIMEOUT_MS = 15_000
const DROP_TARGET_X = 20
const DROP_TARGET_Y = 32

async function read_ordered_task_titles(page: Page, run_id: string): Promise<Array<string>> {
	const rows = page.getByTestId(tid.task_row).filter({ hasText: run_id })
	const row_count = await rows.count()
	const ordered_titles: Array<string> = []

	for (let index = 0; index < row_count; index++) {
		const title = await rows.nth(index).locator('[data-dash-task-title]').first().textContent()

		ordered_titles.push((title ?? '').trim())
	}

	return ordered_titles
}

async function drag_task_after_target(
	page: Page,
	source_title: string,
	target_title: string,
): Promise<void> {
	const source_row = page.getByTestId(tid.task_row).filter({ hasText: source_title }).first()
	const target_row = page.getByTestId(tid.task_row).filter({ hasText: target_title }).first()
	const reorder_response = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/reorder') &&
			response.ok(),
		{ timeout: REORDER_RESPONSE_TIMEOUT_MS },
	)

	await expect(source_row).toBeVisible({ timeout: DASH_ROW_READY_TIMEOUT_MS })
	await expect(target_row).toBeVisible({ timeout: DASH_ROW_READY_TIMEOUT_MS })
	await source_row.dragTo(target_row, { targetPosition: { x: DROP_TARGET_X, y: DROP_TARGET_Y } })
	await reorder_response
}

function moved_first_to_end(titles: ReadonlyArray<string>): Array<string> {
	const [first_title] = titles
	if (first_title === undefined) return []

	return [...titles.slice(1), first_title]
}

function read_drag_titles(initial_order: ReadonlyArray<string>): {
	source_title: string
	target_title: string
} {
	const [source_title, ...rest_titles] = initial_order
	const target_title = rest_titles.at(-1)

	if (source_title === undefined || target_title === undefined) {
		throw new Error('Expected at least two rows for drag-and-drop reorder test')
	}

	return { source_title, target_title }
}

async function run_reorder_and_assert(page: Page, run_id: string): Promise<void> {
	const initial_order = await read_ordered_task_titles(page, run_id)

	expect(initial_order).toHaveLength(3)

	const { source_title, target_title } = read_drag_titles(initial_order)
	const reordered_titles = moved_first_to_end(initial_order)

	await drag_task_after_target(page, source_title, target_title)
	expect(await read_ordered_task_titles(page, run_id)).toEqual(reordered_titles)
	await page.reload()
	await playwright_dash_ux.goto_dash(page)
	await playwright_dash_ux.clear_dash_filters(page)

	expect(await read_ordered_task_titles(page, run_id)).toEqual(reordered_titles)
}

test.describe('/ja/dash task reorder', () => {
	test.beforeEach(async ({ page }) => {
		const worker_index = test.info().workerIndex
		const { worker_auth_path } = await import('./e2e-constants')
		const has_auth =
			existsSync(worker_auth_path(worker_index)) || existsSync(playwright_dash_ux.auth_storage_path)

		test.skip(!has_auth, 'Missing auth storage. Start server with E2E_CLEANUP_ENABLED=1.')
		await playwright_dash_ux.goto_dash(page)
		await playwright_dash_ux.clear_dash_filters(page)
	})

	test('drags a row and keeps order after reload', async ({ page }) => {
		const run_id = `E2E_REORDER_${String(Date.now())}`
		const title_a = `${run_id} A`
		const title_b = `${run_id} B`
		const title_c = `${run_id} C`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.seed_tasks(page, [title_a, title_b, title_c])

			await run_reorder_and_assert(page, run_id)
		}, [title_a, title_b, title_c])
	})
})
