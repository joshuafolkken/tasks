import { describe, expect, it } from 'vitest'
import { dash_form_parse } from './dash-form-parse'

const SAMPLE_DUE_DATE = '2026-05-01'
const SAMPLE_RECURRENCE = 'FREQ=DAILY'
/** Literal errors returned by `dash_form_parse` (Japanese copy in source). */
const ERROR_TASK_ID_REQUIRED_JA = 'タスクIDが必要です'
/** Literal errors returned by `dash_form_parse` (Japanese copy in source). */
const ERROR_TITLE_LINES_REQUIRED_JA = 'タイトルを1行以上入力してください'
const SAMPLE_UPDATE_TASK_ID = 't1'
const MIN_TITLE = 'T'

describe('dash_form_parse.parse_create_body / validation and trimming', () => {
	it('allows empty title (trimmed to empty string)', () => {
		const form_data = new FormData()

		form_data.set('title', '   ')
		const parsed = dash_form_parse.parse_create_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.title).toBe('')
	})

	it('parses trimmed title and body', () => {
		const form_data = new FormData()

		form_data.set('title', '  Hello  ')
		form_data.set('detail', '  body  ')
		const parsed = dash_form_parse.parse_create_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.title).toBe('Hello')
		expect(parsed.value.detail).toBe('body')
		expect(parsed.value.insert_after_task_id).toBeUndefined()
		expect(parsed.value.insert_at_top).toBe(false)
	})
})

describe('dash_form_parse.parse_create_body / optional fields (due, labels)', () => {
	it('parses due_date and recurrence_rule', () => {
		const form_data = new FormData()

		form_data.set('title', 'T')
		form_data.set('due_date', SAMPLE_DUE_DATE)
		form_data.set('recurrence_rule', SAMPLE_RECURRENCE)
		const parsed = dash_form_parse.parse_create_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.due_date).toBe(SAMPLE_DUE_DATE)
		expect(parsed.value.recurrence_rule).toBe(SAMPLE_RECURRENCE)
	})

	it('dedupes label values', () => {
		const duplicate_label = 'a'
		const form_data = new FormData()

		form_data.set('title', 'T')
		form_data.append('labels', duplicate_label)
		form_data.append('labels', duplicate_label)
		form_data.append('labels', 'b')
		const parsed = dash_form_parse.parse_create_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.label_names).toEqual(['a', 'b'])
	})
})

describe('dash_form_parse.parse_create_body / insert position', () => {
	it('parses insert_after_task_id when provided', () => {
		const form_data = new FormData()

		form_data.set('title', MIN_TITLE)
		form_data.set('insert_after_task_id', 'after-1')
		const parsed = dash_form_parse.parse_create_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.insert_after_task_id).toBe('after-1')
		expect(parsed.value.insert_at_top).toBe(false)
	})

	it('parses insert_at_top when set to 1', () => {
		const form_data = new FormData()

		form_data.set('title', MIN_TITLE)
		form_data.set('insert_at_top', '1')
		const parsed = dash_form_parse.parse_create_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.insert_at_top).toBe(true)
	})
})

describe('dash_form_parse.parse_update_task_body', () => {
	it('requires task_id', () => {
		const form_data = new FormData()

		form_data.set('title', 'Hi')
		const parsed = dash_form_parse.parse_update_task_body(form_data)

		expect(parsed.isErr()).toBe(true)
		if (parsed.isOk()) return
		expect(parsed.error).toBe(ERROR_TASK_ID_REQUIRED_JA)
	})

	it('parses task fields and labels', () => {
		const form_data = new FormData()

		form_data.set('task_id', SAMPLE_UPDATE_TASK_ID)
		form_data.set('title', '  T  ')
		form_data.set('detail', '  d  ')
		form_data.append('labels', 'x')
		const parsed = dash_form_parse.parse_update_task_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value).toEqual({
			task_id: SAMPLE_UPDATE_TASK_ID,
			title: 'T',
			detail: 'd',
			due_date: undefined,
			recurrence_rule: undefined,
			label_names: ['x'],
		})
	})
})

describe('dash_form_parse.parse_update_task_body / empty title', () => {
	const DETAIL_WITHOUT_TITLE = 'only detail'

	it('allows empty title on update', () => {
		const form_data = new FormData()

		form_data.set('task_id', SAMPLE_UPDATE_TASK_ID)
		form_data.set('title', '   ')
		form_data.set('detail', DETAIL_WITHOUT_TITLE)
		const parsed = dash_form_parse.parse_update_task_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value.title).toBe('')
		expect(parsed.value.detail).toBe(DETAIL_WITHOUT_TITLE)
	})
})

describe('dash_form_parse.parse_update_task_title_body', () => {
	it('rejects update when task_id is missing', () => {
		const form_data = new FormData()

		form_data.set('title', 'Hello')
		const parsed = dash_form_parse.parse_update_task_title_body(form_data)

		expect(parsed.isErr()).toBe(true)
		if (parsed.isOk()) return
		expect(parsed.error).toBe(ERROR_TASK_ID_REQUIRED_JA)
	})

	it('rejects blank title lines', () => {
		const form_data = new FormData()

		form_data.set('task_id', SAMPLE_UPDATE_TASK_ID)
		form_data.set('title', '  \n  ')
		const parsed = dash_form_parse.parse_update_task_title_body(form_data)

		expect(parsed.isErr()).toBe(true)
		if (parsed.isOk()) return
		expect(parsed.error).toBe(ERROR_TITLE_LINES_REQUIRED_JA)
	})

	it('splits trimmed non-empty lines', () => {
		const form_data = new FormData()

		form_data.set('task_id', SAMPLE_UPDATE_TASK_ID)
		form_data.set('title', ' First \n Second ')
		const parsed = dash_form_parse.parse_update_task_title_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value).toEqual({
			task_id: SAMPLE_UPDATE_TASK_ID,
			title_lines: ['First', 'Second'],
		})
	})
})

describe('dash_form_parse.parse_complete_body', () => {
	it('rejects missing task_id', () => {
		const form_data = new FormData()
		const parsed = dash_form_parse.parse_complete_body(form_data)

		expect(parsed.isErr()).toBe(true)
		if (parsed.isOk()) return
		expect(parsed.error).toBe(ERROR_TASK_ID_REQUIRED_JA)
	})
})

describe('dash_form_parse.parse_reorder_body', () => {
	it('parses sort order fields', () => {
		const form_data = new FormData()

		form_data.set('task_id', 'tid')
		form_data.set('prev_sort_order', 'a')
		form_data.set('next_sort_order', 'b')
		const parsed = dash_form_parse.parse_reorder_body(form_data)

		expect(parsed.isOk()).toBe(true)
		if (parsed.isErr()) return
		expect(parsed.value).toEqual({
			task_id: 'tid',
			prev_sort_order: 'a',
			next_sort_order: 'b',
		})
	})
})
