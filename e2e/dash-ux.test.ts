/* eslint-disable max-lines-per-function -- Playwright: nested describes share helpers; splitting obscures flow */
import { existsSync } from 'node:fs'
import {
	DASH_JA_COMPLETED_ON_PREFIX,
	DASH_JA_RECURRENCE_BUTTON,
	DASH_JA_TAB_ACTIVE,
	DASH_JA_UNCOMPLETE_TASK_ARIA,
} from './dash-ja-strings'
import { playwright_dash_ux } from './dash-ux-helpers'
import { expect, test, type Page } from './worker-fixtures'

const tid = playwright_dash_ux.testid
const RELOAD_STABLE_TIMEOUT_MS = 25_000
const SPA_TAB_URL_WAIT_MS = 25_000

async function seed_two_tasks_for_search_test(page: Page, run_id: string): Promise<void> {
	await playwright_dash_ux.seed_tasks(page, [`${run_id} AppleOnly`, `${run_id} BananaOnly`])
	await playwright_dash_ux.clear_dash_filters(page)
}

async function cycle_search_filter_to_or(page: Page): Promise<void> {
	const mode_toggle = page.getByTestId(tid.filter_mode)
	const max_mode_clicks = 8
	let clicks_left = max_mode_clicks

	while (clicks_left > 0) {
		clicks_left -= 1
		const label = ((await mode_toggle.textContent()) ?? '').trim()
		if (label === 'OR') return

		await mode_toggle.click()
	}
}

async function expect_and_or_search_rows(page: Page, run_id: string): Promise<void> {
	await expect(page.getByRole('button', { name: `${run_id} AppleOnly` })).toBeVisible({
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
	await expect(page.getByRole('button', { name: `${run_id} BananaOnly` })).toBeVisible({
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
	await page.getByTestId(tid.search).fill('AppleOnly BananaOnly')
	await expect(page.getByTestId(tid.task_row).filter({ hasText: run_id })).toHaveCount(0, {
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
	await cycle_search_filter_to_or(page)
	await expect(page.getByTestId(tid.filter_mode)).toHaveText('OR')
	await expect(page.getByTestId(tid.task_row).filter({ hasText: run_id })).toHaveCount(2, {
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
}

async function open_done_tab_with_task(page: Page, run_id: string): Promise<void> {
	await playwright_dash_ux.goto_done_tab_ja(page)
	await expect(page.getByTestId(tid.task_row).filter({ hasText: run_id })).toBeVisible({
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
}

test.describe('/ja/dash authenticated UX (issue #18)', () => {
	test.beforeEach(async ({ page }) => {
		const worker_index = test.info().workerIndex
		const { worker_auth_path } = await import('./e2e-constants')
		const has_auth =
			existsSync(worker_auth_path(worker_index)) || existsSync(playwright_dash_ux.auth_storage_path)

		test.skip(!has_auth, 'Missing auth storage. Start server with E2E_CLEANUP_ENABLED=1.')
		await playwright_dash_ux.goto_dash(page)
		await playwright_dash_ux.clear_dash_filters(page)
	})
	/* Auth: worker-fixtures.ts injects per-worker storageState — no UI login per test. */

	test.describe('Add task row', () => {
		test('Add a task opens the editor at the top and focuses the title field', async ({ page }) => {
			const run_id = `E2E_ADD_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.open_new_task_editor(page)
				await expect(page.getByTestId(tid.inline_title)).toBeFocused()
				await page.getByTestId(tid.inline_title).fill(run_id)
				await playwright_dash_ux.blur_inline_editor(page)
				await expect(page.getByRole('button', { name: run_id })).toBeVisible()
			}, [run_id])
		})

		test('Focusing away from an empty new row discards it', async ({ page }) => {
			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.open_new_task_editor(page)
				await playwright_dash_ux.blur_inline_editor(page)
				await expect(page.getByTestId(tid.inline_title)).toHaveCount(0)
			})
		})

		test('Clicking Add a task repeatedly keeps a single row and refocuses the title', async ({
			page,
		}) => {
			await playwright_dash_ux.run_authed(page, async () => {
				await page.getByTestId(tid.add_task).click()
				await expect(page.getByTestId(tid.inline_title)).toBeVisible()
				await page.getByTestId(tid.add_task).click()
				await expect(page.getByTestId(tid.inline_title)).toHaveCount(1)
				await expect(page.getByTestId(tid.inline_title)).toBeFocused()
			})
		})

		test('Shows a toast when the server returns an error on Add a task', async ({ page }) => {
			await playwright_dash_ux.run_authed(page, async () => {
				await page.route('**/dash?/create', async (route) => {
					await route.fulfill({ status: 500 })
				})
				await page.getByTestId(tid.add_task).click()
				await expect(page.locator('[data-sonner-toast][data-type="error"]')).toBeVisible()
			})
		})
	})

	test.describe('Edit and commit', () => {
		test('Blurring the title without Enter saves the task', async ({ page }) => {
			const run_id = `E2E_BLUR_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.save_new_task(page, run_id)
				await expect(page.getByRole('button', { name: run_id })).toBeVisible()
			}, [run_id])
		})

		test('Clicking the row body (not complete) opens edit mode', async ({ page }) => {
			const run_id = `E2E_ROW_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.save_new_task(page, run_id)
				await expect(page.getByTestId(tid.task_row).filter({ hasText: run_id })).toBeVisible({
					timeout: RELOAD_STABLE_TIMEOUT_MS,
				})
				await page
					.getByTestId(tid.task_row)
					.filter({ hasText: run_id })
					.locator('.min-w-0.flex-1')
					.first()
					.click({ position: { x: 80, y: 16 } })
				await expect(page.getByTestId(tid.inline_title)).toBeVisible()
				await expect(page.getByTestId(tid.inline_title)).toHaveValue(run_id)
			}, [run_id])
		})

		test('Clicking another row title switches the edited task', async ({ page }) => {
			const run_id = `E2E_SW_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.seed_tasks(page, [`${run_id} A`, `${run_id} B`])
				await playwright_dash_ux.inline_title_via_button(page, `${run_id} A`, `${run_id} A`)
				await playwright_dash_ux.inline_title_via_button(page, `${run_id} B`, `${run_id} B`)
			}, [`${run_id} A`, `${run_id} B`])
		})
	})

	test.describe('Search', () => {
		test('Free-text AND/OR mode is reflected in token matching', async ({ page }) => {
			const run_id = `E2E_FT_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await seed_two_tasks_for_search_test(page, run_id)
				await expect_and_or_search_rows(page, run_id)
			}, [`${run_id} AppleOnly`, `${run_id} BananaOnly`])
		})
	})

	test.describe('Active / completed', () => {
		test('Active and completed tabs show different lists', async ({ page }) => {
			const run_id = `E2E_TAB_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.save_new_task(page, run_id)
				await playwright_dash_ux.complete_task_by_text(page, run_id)
				await expect(page.getByRole('button', { name: run_id })).toHaveCount(0, {
					timeout: RELOAD_STABLE_TIMEOUT_MS,
				})
				await playwright_dash_ux.goto_done_tab_ja(page)
				await expect(
					page.getByTestId(tid.task_row).getByLabel(DASH_JA_UNCOMPLETE_TASK_ARIA).first(),
				).toBeVisible({ timeout: RELOAD_STABLE_TIMEOUT_MS })
				await playwright_dash_ux.goto_dash(page)
				await expect(page).not.toHaveURL(/[?&]done=1/u, { timeout: SPA_TAB_URL_WAIT_MS })
			}, [run_id])
		})

		test('Completed tab can restore a task to active', async ({ page }) => {
			const run_id = `E2E_UN_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.save_new_task(page, run_id)
				await playwright_dash_ux.complete_task_by_text(page, run_id)
				await expect(page.getByRole('button', { name: run_id })).toHaveCount(0, {
					timeout: RELOAD_STABLE_TIMEOUT_MS,
				})
				await open_done_tab_with_task(page, run_id)
				await page
					.getByTestId(tid.task_row)
					.filter({ hasText: run_id })
					.getByLabel(DASH_JA_UNCOMPLETE_TASK_ARIA)
					.click()
				await expect(page.getByTestId(tid.task_row).filter({ hasText: run_id })).toHaveCount(0)
				await page.getByRole('link', { name: DASH_JA_TAB_ACTIVE }).click()
				await expect(page).not.toHaveURL(/[?&]done=1/u, { timeout: SPA_TAB_URL_WAIT_MS })
				await expect(page.getByRole('button', { name: run_id })).toBeVisible()
			}, [run_id])
		})

		test('Completed tab shows completion timestamp', async ({ page }) => {
			const run_id = `E2E_DONE_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.save_new_task(page, run_id)
				await playwright_dash_ux.complete_task_by_text(page, run_id)
				await expect(page.getByRole('button', { name: run_id })).toHaveCount(0, {
					timeout: RELOAD_STABLE_TIMEOUT_MS,
				})
				await open_done_tab_with_task(page, run_id)
				await expect(
					page
						.getByTestId(tid.task_row)
						.filter({ hasText: run_id })
						.getByText(DASH_JA_COMPLETED_ON_PREFIX, { exact: false }),
				).toBeVisible({ timeout: RELOAD_STABLE_TIMEOUT_MS })
			}, [run_id])
		})
	})

	test.describe('Keyboard and dialogs', () => {
		test('Escape cancels inline edit without saving a new title', async ({ page }) => {
			const run_id = `E2E_ESC_${String(Date.now())}`

			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.open_new_task_editor(page)
				await page.getByTestId(tid.inline_title).fill(run_id)
				await page.keyboard.press('Escape')
				await expect(page.getByTestId(tid.inline_title)).toHaveCount(0)
				await expect(page.getByRole('button', { name: run_id })).toHaveCount(0)
			})
		})

		test('Recurrence dialog opens from the inline editor', async ({ page }) => {
			await playwright_dash_ux.run_authed(page, async () => {
				await playwright_dash_ux.open_new_task_editor(page)
				await page.getByRole('button', { name: DASH_JA_RECURRENCE_BUTTON }).click()
				await expect(page.getByTestId(tid.recurrence_dialog)).toBeVisible()
			})
		})
	})
})
