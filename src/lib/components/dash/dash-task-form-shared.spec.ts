import type { ActionResult } from '@sveltejs/kit'
import { describe, expect, it } from 'vitest'
import { dash_task_form_shared, RRULE_BUTTON_DISPLAY_MAX_CHARS } from './dash-task-form-shared'

const ERROR_MESSAGE = 'Something went wrong'
const EXISTING_LABEL_NAME = 'existing-label'

describe('read_action_error', () => {
	it('returns default message for non-failure result', () => {
		const result: ActionResult = { type: 'success', status: 200, data: {} }

		expect(dash_task_form_shared.read_action_error(result)).toBeTypeOf('string')
	})

	it('returns default message for failure without error field', () => {
		const result: ActionResult = { type: 'failure', status: 400 }

		expect(dash_task_form_shared.read_action_error(result)).toBeTypeOf('string')
	})

	it('returns the error field from failure data', () => {
		const result: ActionResult = {
			type: 'failure',
			status: 400,
			data: { error: ERROR_MESSAGE },
		}

		expect(dash_task_form_shared.read_action_error(result)).toBe(ERROR_MESSAGE)
	})

	it('returns default message when error field is not a string', () => {
		const result: ActionResult = {
			type: 'failure',
			status: 400,
			data: { error: 42 },
		}

		expect(dash_task_form_shared.read_action_error(result)).toBeTypeOf('string')
	})
})

describe('truncate_rule_for_button', () => {
	it('returns the original string when within the limit', () => {
		const short = 'FREQ=WEEKLY'

		expect(dash_task_form_shared.truncate_rule_for_button(short)).toBe(short)
	})

	it('truncates and appends ellipsis when exceeding the limit', () => {
		const long = 'A'.repeat(RRULE_BUTTON_DISPLAY_MAX_CHARS + 5)
		const result = dash_task_form_shared.truncate_rule_for_button(long)

		expect(result.endsWith('…')).toBe(true)
		expect(result.length).toBe(RRULE_BUTTON_DISPLAY_MAX_CHARS)
	})

	it('returns the original string at exactly the limit', () => {
		const exact = 'A'.repeat(RRULE_BUTTON_DISPLAY_MAX_CHARS)

		expect(dash_task_form_shared.truncate_rule_for_button(exact)).toBe(exact)
	})
})

function make_form_mock(contains_result: boolean): HTMLFormElement {
	return { contains: () => contains_result } as unknown as HTMLFormElement
}

describe('is_focus_still_inside_form', () => {
	it('returns false when related is not provided', () => {
		const form = make_form_mock(true)

		expect(dash_task_form_shared.is_focus_still_inside_form(form)).toBe(false)
	})

	it('returns false when form_element does not contain related', () => {
		const form = make_form_mock(false)
		const node = {} as unknown as Node

		expect(dash_task_form_shared.is_focus_still_inside_form(form, node)).toBe(false)
	})

	it('returns true when related is inside form_element', () => {
		const form = make_form_mock(true)
		const node = {} as unknown as Node

		expect(dash_task_form_shared.is_focus_still_inside_form(form, node)).toBe(true)
	})

	it('returns false when related is outside form_element', () => {
		const form = make_form_mock(false)
		const node = {} as unknown as Node

		expect(dash_task_form_shared.is_focus_still_inside_form(form, node)).toBe(false)
	})
})

describe('format_due_date_display', () => {
	it('returns empty string for empty input', () => {
		expect(dash_task_form_shared.format_due_date_display('')).toBe('')
	})

	it('returns a non-empty string for a valid date', () => {
		const result = dash_task_form_shared.format_due_date_display('2026-04-11')

		expect(result.length).toBeGreaterThan(0)
	})
})

describe('compute_pending_new_labels', () => {
	it('returns labels not present in existing', () => {
		const selected = ['new-label', EXISTING_LABEL_NAME]
		const existing = [{ id: '1', name: EXISTING_LABEL_NAME }]

		expect(dash_task_form_shared.compute_pending_new_labels(selected, existing)).toEqual([
			'new-label',
		])
	})

	it('returns empty array when all selected labels already exist', () => {
		const selected = ['alpha']
		const existing = [{ id: '1', name: 'alpha' }]

		expect(dash_task_form_shared.compute_pending_new_labels(selected, existing)).toEqual([])
	})
})

describe('compute_label_suggestions', () => {
	const labels = [
		{ id: '1', name: 'work' },
		{ id: '2', name: 'personal' },
		{ id: '3', name: 'weekend' },
	]

	it('returns empty array for empty input', () => {
		expect(dash_task_form_shared.compute_label_suggestions('', labels, [])).toEqual([])
	})

	it('returns matching labels that are not already selected', () => {
		const result = dash_task_form_shared.compute_label_suggestions('w', labels, [])

		expect(result.map((label) => label.name)).toEqual(['work', 'weekend'])
	})

	it('excludes already selected labels from suggestions', () => {
		const result = dash_task_form_shared.compute_label_suggestions('w', labels, ['work'])

		expect(result.map((label) => label.name)).toEqual(['weekend'])
	})

	it('is case-insensitive', () => {
		const result = dash_task_form_shared.compute_label_suggestions('WORK', labels, [])

		expect(result.map((label) => label.name)).toEqual(['work'])
	})
})
