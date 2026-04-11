/* eslint-disable unicorn/no-null -- TaskFieldSnapshot mirrors nullable DB fields */
import type { ActionResult } from '@sveltejs/kit'
import { describe, expect, it } from 'vitest'
import { dash_task_form_shared, RRULE_BUTTON_DISPLAY_MAX_CHARS } from './dash-task-form-shared'

const ERROR_MESSAGE = 'Something went wrong'
const EXISTING_LABEL_NAME = 'existing-label'
const RRULE_WEEKLY = 'FREQ=WEEKLY'

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
		const short = RRULE_WEEKLY

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

describe('apply_add_label', () => {
	it('appends the trimmed name when not already present', () => {
		expect(dash_task_form_shared.apply_add_label(['a'], 'b')).toEqual(['a', 'b'])
	})

	it('trims the name before adding', () => {
		expect(dash_task_form_shared.apply_add_label([], '  hello  ')).toEqual(['hello'])
	})

	it('returns the same array when the trimmed name already exists', () => {
		const original = ['a']
		const result = dash_task_form_shared.apply_add_label(original, 'a')

		expect(result).toBe(original)
	})

	it('returns the same array for an empty string', () => {
		const original = ['a']
		const result = dash_task_form_shared.apply_add_label(original, '')

		expect(result).toBe(original)
	})

	it('returns the same array for a whitespace-only string', () => {
		const original = ['a']
		const result = dash_task_form_shared.apply_add_label(original, '   ')

		expect(result).toBe(original)
	})
})

describe('apply_toggle_label', () => {
	it('adds the name when not present', () => {
		expect(dash_task_form_shared.apply_toggle_label(['a'], 'b')).toEqual(['a', 'b'])
	})

	it('removes the name when already present', () => {
		expect(dash_task_form_shared.apply_toggle_label(['a', 'b'], 'a')).toEqual(['b'])
	})
})

const TASK_DUE_DATE = '2026-01-01'
const TASK_RRULE = 'FREQ=DAILY'

const TASK_BASE = {
	title: 'hello',
	detail: 'details',
	task_labels: [{ label: { name: 'work' } }],
	due_date: TASK_DUE_DATE,
	recurrence_rule: TASK_RRULE,
} as const

const FORM_MATCHING = {
	title: 'hello',
	detail: 'details',
	selected_labels: ['work'],
	due_date: TASK_DUE_DATE,
	rrule: TASK_RRULE,
} as const

describe('is_inline_form_dirty / matching and text fields', () => {
	it('returns false when all fields match the task', () => {
		expect(dash_task_form_shared.is_inline_form_dirty(FORM_MATCHING, TASK_BASE)).toBe(false)
	})

	it('ignores leading/trailing whitespace in title and detail', () => {
		const form = { ...FORM_MATCHING, title: '  hello  ', detail: '  details  ' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, TASK_BASE)).toBe(false)
	})

	it('returns true when title differs', () => {
		const form = { ...FORM_MATCHING, title: 'changed' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, TASK_BASE)).toBe(true)
	})

	it('returns true when detail differs', () => {
		const form = { ...FORM_MATCHING, detail: 'other' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, TASK_BASE)).toBe(true)
	})

	it('treats null task detail as empty string', () => {
		const task = { ...TASK_BASE, detail: null }
		const form = { ...FORM_MATCHING, detail: '' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, task)).toBe(false)
	})
})

describe('is_inline_form_dirty / labels and schedule', () => {
	it('returns true when label set differs', () => {
		const form = { ...FORM_MATCHING, selected_labels: ['personal'] }

		expect(dash_task_form_shared.is_inline_form_dirty(form, TASK_BASE)).toBe(true)
	})

	it('returns true when due_date differs', () => {
		const form = { ...FORM_MATCHING, due_date: '2026-06-01' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, TASK_BASE)).toBe(true)
	})

	it('treats null task due_date as empty string', () => {
		const task = { ...TASK_BASE, due_date: null }
		const form = { ...FORM_MATCHING, due_date: '' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, task)).toBe(false)
	})

	it('returns true when rrule differs', () => {
		const form = { ...FORM_MATCHING, rrule: RRULE_WEEKLY }

		expect(dash_task_form_shared.is_inline_form_dirty(form, TASK_BASE)).toBe(true)
	})

	it('treats null task recurrence_rule as empty string', () => {
		const task = { ...TASK_BASE, recurrence_rule: null }
		const form = { ...FORM_MATCHING, rrule: '' }

		expect(dash_task_form_shared.is_inline_form_dirty(form, task)).toBe(false)
	})
})
