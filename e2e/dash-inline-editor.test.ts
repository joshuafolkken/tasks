/* eslint-disable max-lines, max-lines-per-function, max-statements -- Playwright: nested describes share helpers */
import { existsSync } from 'node:fs'
import {
	DASH_JA_RECURRENCE_BUTTON,
	DASH_JA_RECURRENCE_CLOSE,
	DASH_JA_RR_DAILY,
} from './dash-ja-strings'
import { playwright_dash_ux } from './dash-ux-helpers'
import { expect, test, type Locator, type Page, type Response } from './worker-fixtures'

const tid = playwright_dash_ux.testid
const RELOAD_STABLE_TIMEOUT_MS = 10_000
/** Native `showPicker()` is not reliable in CI; same `input`/`change` path as picking a date. */
const DUE_DATE_ISO_STUB = '2030-06-15'
const DASH_FORM_DUE_INPUT_NAME = 'due_date'
const RECURRENCE_FREQ_SELECT = '#recurrence_freq'
const RECURRENCE_OPTION_DAILY = 'daily'
const ATTR_DASH_TASK_CARD = 'data-dash-task-card'
const TASK_CARD_SELECTOR = `[${ATTR_DASH_TASK_CARD}]`
const TITLE_BUTTON_TASK_ID_ATTR = 'data-task-id'

/** Playwright `toBeFocused()` treats elements as "inactive" until modal `inert` clears after `</dialog>`. */
async function expect_dom_focus_on(locator: Locator): Promise<void> {
	await expect
		.poll(async () => await locator.evaluate((element) => document.activeElement === element), {
			timeout: RELOAD_STABLE_TIMEOUT_MS,
		})
		.toBe(true)
}

async function expect_focused_inline_value(page: Page, value: string): Promise<void> {
	await expect
		.poll(
			async () =>
				await page.evaluate(
					(payload: { testid: string; expected: string }) => {
						const active = document.activeElement
						if (!(active instanceof HTMLInputElement)) return false
						if (Reflect.get(active.dataset, 'testid') !== payload.testid) return false

						return active.value === payload.expected
					},
					{ testid: tid.inline_title, expected: value },
				),
			{ timeout: RELOAD_STABLE_TIMEOUT_MS },
		)
		.toBe(true)
}

async function read_title_button_task_id(page: Page, title: string): Promise<string> {
	const raw = await page
		.getByRole('button', { name: title })
		.getAttribute(TITLE_BUTTON_TASK_ID_ATTR)

	expect(raw, `missing ${TITLE_BUTTON_TASK_ID_ATTR} on title button`).toBeTruthy()

	return String(raw)
}

async function read_inline_card_id(page: Page): Promise<string> {
	const raw = await page.evaluate(
		(payload: { attr: string; row_sel: string; testid: string }) => {
			const element = document.querySelector(`[data-testid="${payload.testid}"]`)
			if (!(element instanceof HTMLInputElement)) return ''

			const card = element.closest(payload.row_sel)
			if (!(card instanceof Element)) return ''

			return (card.getAttribute(payload.attr) ?? '').trim()
		},
		{ attr: ATTR_DASH_TASK_CARD, row_sel: TASK_CARD_SELECTOR, testid: tid.inline_title },
	)

	expect(raw, 'inline title must sit inside a task card').not.toBe('')

	return raw
}

async function expect_inline_open_in_card(
	page: Page,
	task_card_id: string,
	title_value: string,
): Promise<void> {
	await expect
		.poll(
			async () =>
				await page.evaluate(
					(payload: { attr: string; testid: string; card_id: string; value: string }) => {
						const host = document.querySelector(
							`[${payload.attr}="${payload.card_id}"] [data-testid="${payload.testid}"]`,
						)

						return host instanceof HTMLInputElement && host.value === payload.value
					},
					{
						attr: ATTR_DASH_TASK_CARD,
						testid: tid.inline_title,
						card_id: task_card_id,
						value: title_value,
					},
				),
			{ timeout: RELOAD_STABLE_TIMEOUT_MS },
		)
		.toBe(true)
}

function title_input_in_task_card(page: Page, task_id: string): Locator {
	return page
		.locator(`${TASK_CARD_SELECTOR}[data-dash-task-card="${task_id}"]`)
		.getByTestId(tid.inline_title)
}

async function wait_for_update_task_ok(page: Page): Promise<Response> {
	return await page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' &&
			response.url().includes('?/update_task') &&
			response.ok(),
		{ timeout: RELOAD_STABLE_TIMEOUT_MS },
	)
}

async function close_recurrence_after_daily(page: Page): Promise<void> {
	await page.getByRole('button', { name: DASH_JA_RECURRENCE_BUTTON }).click()
	await expect(page.getByTestId(tid.recurrence_dialog)).toBeVisible()
	await page
		.getByTestId(tid.recurrence_dialog)
		.locator(RECURRENCE_FREQ_SELECT)
		.selectOption(RECURRENCE_OPTION_DAILY)
	await page
		.getByTestId(tid.recurrence_dialog)
		.getByRole('button', { name: DASH_JA_RECURRENCE_CLOSE })
		.click()
}

/** After RR save the form is pristine; deferred blur intentionally does not exit edit (see inline editor). */
async function expect_rr_closed_keeps_inline(
	page: Page,
	card_id: string,
	run_id: string,
): Promise<void> {
	await expect(page.getByTestId(tid.recurrence_dialog)).toBeHidden()
	await expect_inline_open_in_card(page, card_id, run_id)
}

const INLINE_RR_BUTTON_TESTID = 'dash-inline-recurrence-button'

async function goto_open_inline_with_title(page: Page, run_id: string): Promise<string> {
	await playwright_dash_ux.open_new_task_editor(page)
	await page.getByTestId(tid.inline_title).fill(run_id)

	return await read_inline_card_id(page)
}

async function expect_inline_rrule_daily_chip(page: Page): Promise<void> {
	await expect(page.getByTestId(INLINE_RR_BUTTON_TESTID)).toHaveText(DASH_JA_RR_DAILY, {
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
}

async function reopen_rr_dialog_expect_daily(page: Page): Promise<void> {
	await page.getByTestId(INLINE_RR_BUTTON_TESTID).click()
	await expect(page.getByTestId(tid.recurrence_dialog)).toBeVisible()
	await expect(page.getByTestId(tid.recurrence_dialog).locator(RECURRENCE_FREQ_SELECT)).toHaveValue(
		RECURRENCE_OPTION_DAILY,
	)
	await page
		.getByTestId(tid.recurrence_dialog)
		.getByRole('button', { name: DASH_JA_RECURRENCE_CLOSE })
		.click()
}

async function assert_rr_reopen_daily_flow(page: Page, run_id: string): Promise<string> {
	const editing_card_id = await goto_open_inline_with_title(page, run_id)

	const update_after_first_rr = wait_for_update_task_ok(page)

	await close_recurrence_after_daily(page)
	await update_after_first_rr

	await expect_inline_rrule_daily_chip(page)
	await reopen_rr_dialog_expect_daily(page)

	return editing_card_id
}

interface ArrowDownTwiceChain {
	page: Page
	top_title: string
	mid_title: string
	end_title: string
}

async function expect_arrow_down_twice(chain: ArrowDownTwiceChain): Promise<void> {
	await expect_focused_inline_value(chain.page, chain.top_title)
	await chain.page.getByTestId(tid.inline_title).focus()
	await chain.page.keyboard.press('ArrowDown')
	await expect_focused_inline_value(chain.page, chain.mid_title)

	await chain.page.keyboard.press('ArrowDown')
	await expect_focused_inline_value(chain.page, chain.end_title)
}

/** After RR, Escape is flaky; navigate to /ja/dash to exit inline, then assert title rows for teardown. */
async function reload_expect_title_button(page: Page, run_id: string): Promise<void> {
	await playwright_dash_ux.goto_dash(page)
	await playwright_dash_ux.clear_dash_filters(page)
	await expect(page.getByRole('button', { name: run_id }).first()).toBeVisible({
		timeout: RELOAD_STABLE_TIMEOUT_MS,
	})
}

async function assert_rr_dialog_refocus_title(page: Page, run_id: string): Promise<void> {
	await playwright_dash_ux.open_new_task_editor(page)
	await page.getByTestId(tid.inline_title).fill(run_id)
	const editing_task_card_id = await read_inline_card_id(page)
	const update_after_rr = wait_for_update_task_ok(page)

	await close_recurrence_after_daily(page)
	await update_after_rr

	await expect_rr_closed_keeps_inline(page, editing_task_card_id, run_id)
	await reload_expect_title_button(page, run_id)
}

async function fire_inline_due_change(page: Page, iso_date: string): Promise<void> {
	const date_input = page
		.locator(TASK_CARD_SELECTOR)
		.filter({ has: page.getByTestId(tid.inline_title) })
		.locator(`input[name="${DASH_FORM_DUE_INPUT_NAME}"]`)

	await date_input.evaluate((element: HTMLInputElement, value: string) => {
		element.value = value
		element.dispatchEvent(new Event('input', { bubbles: true }))
		element.dispatchEvent(new Event('change', { bubbles: true }))
	}, iso_date)
}

test.describe('/ja/dash inline editor labels, arrows, and sustained focus', () => {
	test.beforeEach(async ({ page }) => {
		const worker_index = test.info().workerIndex
		const { worker_auth_path } = await import('./e2e-constants')
		const has_auth =
			existsSync(worker_auth_path(worker_index)) || existsSync(playwright_dash_ux.auth_storage_path)

		test.skip(!has_auth, 'Missing auth storage. Start server with E2E_CLEANUP_ENABLED=1.')
		await playwright_dash_ux.goto_dash(page)
		await playwright_dash_ux.clear_dash_filters(page)
	})

	test('Enter in the label field shows a new chip without blurring', async ({ page }) => {
		const run_id = `E2E_LBL_${String(Date.now())}`
		const label_token = `E2E_LblTok_${String(Date.now())}`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.save_new_task(page, run_id)
			await playwright_dash_ux.inline_title_via_button(page, run_id, run_id)
			const label_input = page.getByTestId(tid.inline_label_input)

			await label_input.fill(label_token)
			await expect(label_input).toHaveValue(label_token)
			await label_input.press('Enter')
			await expect(page.locator(`input[name="labels"][value="${label_token}"]`)).toBeAttached({
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
			await expect(page.getByTestId(tid.inline_title)).toBeVisible()
			await expect(label_input).toBeFocused()
		}, [run_id])
	})

	test('ArrowDown on the title moves edit focus to the next row', async ({ page }) => {
		const run_id = `E2E_ADN_${String(Date.now())}`
		const title_a = `${run_id}_A`
		const title_b = `${run_id}_B`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.seed_tasks(page, [title_a, title_b])
			const id_a = await read_title_button_task_id(page, title_a)
			const id_b = await read_title_button_task_id(page, title_b)

			await page.getByRole('button', { name: title_b }).click()
			const input_b = title_input_in_task_card(page, id_b)

			await expect(input_b).toHaveValue(title_b)
			await input_b.focus()
			await expect(input_b).toBeFocused()
			await page.keyboard.press('ArrowDown')
			await expect(title_input_in_task_card(page, id_a)).toHaveValue(title_a, {
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
		}, [title_a, title_b])
	})

	test('ArrowUp on the title moves edit focus to the previous row', async ({ page }) => {
		const run_id = `E2E_AUP_${String(Date.now())}`
		const title_a = `${run_id}_A`
		const title_b = `${run_id}_B`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.seed_tasks(page, [title_a, title_b])
			await page.getByTestId(tid.search).fill(run_id)
			await expect(page.getByTestId(tid.task_row).filter({ hasText: run_id })).toHaveCount(2, {
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})

			await page.getByRole('button', { name: title_a }).click()
			const input_a = page.getByTestId(tid.inline_title)

			await expect_focused_inline_value(page, title_a)
			await input_a.focus()
			await page.keyboard.press('ArrowUp')
			await expect_focused_inline_value(page, title_b)
		}, [title_a, title_b])
	})

	test('Due date change keeps the inline title field focused', async ({ page }) => {
		const run_id = `E2E_DUE_${String(Date.now())}`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.open_new_task_editor(page)
			await page.getByTestId(tid.inline_title).fill(run_id)
			await fire_inline_due_change(page, DUE_DATE_ISO_STUB)
			await expect_dom_focus_on(page.getByTestId(tid.inline_title))
			await playwright_dash_ux.blur_inline_editor(page)
			await expect(page.getByRole('button', { name: run_id })).toBeVisible({
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
		}, [run_id])
	})

	test('Closing recurrence dialog keeps the same task row in inline edit', async ({ page }) => {
		const run_id = `E2E_RR_${String(Date.now())}`

		await playwright_dash_ux.run_authed(page, async () => {
			await assert_rr_dialog_refocus_title(page, run_id)
		}, [run_id])
	})

	test('ArrowDown on an empty inline row discards it and opens the next row', async ({ page }) => {
		const run_id = `E2E_EDSC_${String(Date.now())}`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.save_new_task(page, run_id)
			await playwright_dash_ux.open_new_task_editor(page)
			await expect(page.getByTestId(tid.inline_title)).toBeVisible()
			// The inline title is empty – navigate down to discard and open the next row
			await page.getByTestId(tid.inline_title).press('ArrowDown')
			// Empty row is discarded asynchronously; wait until only one editor remains
			await expect(page.getByTestId(tid.inline_title)).toHaveCount(1, {
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
			// Next row should now be open in the inline editor with a persisted title.
			const destination_title = page.getByTestId(tid.inline_title)

			await expect(destination_title).not.toHaveValue('', { timeout: RELOAD_STABLE_TIMEOUT_MS })
			/* Pristine blur no longer exits edit (see DashTaskInlineEditor `run_deferred_blur_commit`). */
			await page.keyboard.press('Escape')
			await expect(page.getByRole('button', { name: run_id })).toBeVisible({
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
		}, [run_id])
	})

	test('Recurrence dialog shows previous settings when reopened', async ({ page }) => {
		const run_id = `E2E_RROP_${String(Date.now())}`

		await playwright_dash_ux.run_authed(page, async () => {
			const editing_card_id = await assert_rr_reopen_daily_flow(page, run_id)

			await expect_rr_closed_keeps_inline(page, editing_card_id, run_id)
			await reload_expect_title_button(page, run_id)
		}, [run_id])
	})

	test('Continuous ArrowDown navigates through multiple rows in sequence', async ({ page }) => {
		const run_id = `E2E_CNV_${String(Date.now())}`
		const title_a = `${run_id}_A`
		const title_b = `${run_id}_B`
		const title_c = `${run_id}_C`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.seed_tasks(page, [title_a, title_b, title_c])

			await page.getByRole('button', { name: title_c }).click()
			await expect_arrow_down_twice({
				page,
				top_title: title_c,
				mid_title: title_b,
				end_title: title_a,
			})
		}, [title_a, title_b, title_c])
	})

	test('ArrowDown from an empty new row focuses the title of the destination row', async ({
		page,
	}) => {
		const run_id = `E2E_EFOC_${String(Date.now())}`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.save_new_task(page, run_id)
			await playwright_dash_ux.open_new_task_editor(page)
			await expect(page.getByTestId(tid.inline_title)).toBeVisible()
			await page.getByTestId(tid.inline_title).press('ArrowDown')
			await expect(page.getByTestId(tid.inline_title)).toHaveCount(1, {
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
			await expect_dom_focus_on(page.getByTestId(tid.inline_title))
		}, [run_id])
	})

	test('Ctrl+N on the title navigates down to the next row', async ({ page }) => {
		const run_id = `E2E_CTRLN_${String(Date.now())}`
		const title_a = `${run_id}_A`
		const title_b = `${run_id}_B`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.seed_tasks(page, [title_a, title_b])
			const id_b = await read_title_button_task_id(page, title_b)
			const id_a = await read_title_button_task_id(page, title_a)

			await page.getByRole('button', { name: title_b }).click()
			await expect(title_input_in_task_card(page, id_b)).toHaveValue(title_b)
			await title_input_in_task_card(page, id_b).press('Control+n')
			await expect(title_input_in_task_card(page, id_a)).toHaveValue(title_a, {
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
			await expect_dom_focus_on(title_input_in_task_card(page, id_a))
		}, [title_a, title_b])
	})

	test('Ctrl+U on the title navigates up to the previous row', async ({ page }) => {
		const run_id = `E2E_CTRLU_${String(Date.now())}`
		const title_a = `${run_id}_A`
		const title_b = `${run_id}_B`

		await playwright_dash_ux.run_authed(page, async () => {
			await playwright_dash_ux.seed_tasks(page, [title_a, title_b])
			const id_a = await read_title_button_task_id(page, title_a)
			const id_b = await read_title_button_task_id(page, title_b)

			await page.getByRole('button', { name: title_a }).click()
			await expect(title_input_in_task_card(page, id_a)).toHaveValue(title_a)
			await title_input_in_task_card(page, id_a).press('Control+u')
			await expect(title_input_in_task_card(page, id_b)).toHaveValue(title_b, {
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
			await expect_dom_focus_on(title_input_in_task_card(page, id_b))
		}, [title_a, title_b])
	})

	test('Cmd+K shortcut focuses the search input', async ({ page }) => {
		await page.keyboard.press('Meta+k')
		await expect_dom_focus_on(page.getByTestId(tid.search))
	})

	test('Cmd+Shift+O shortcut opens a new task editor at the top', async ({ page }) => {
		await playwright_dash_ux.run_authed(page, async () => {
			await page.keyboard.press('Meta+Shift+O')
			await expect(page.getByTestId(tid.inline_title)).toBeVisible({
				timeout: RELOAD_STABLE_TIMEOUT_MS,
			})
			await expect_dom_focus_on(page.getByTestId(tid.inline_title))
		})
	})
})
