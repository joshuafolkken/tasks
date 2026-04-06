/* eslint-disable unicorn/no-null -- mirrors Drizzle nullable columns */
import { describe, expect, it } from 'vitest'
import { is_row_discard_empty } from './dash-task-completion'

const EMPTY_ROW = { title: '', detail: null, due_date: null, recurrence_rule: null }

describe('is_row_discard_empty', () => {
	it('returns true when title is empty', () => {
		expect(is_row_discard_empty(EMPTY_ROW)).toBe(true)
	})

	it('returns true when title is only whitespace', () => {
		expect(is_row_discard_empty({ ...EMPTY_ROW, title: '   ' })).toBe(true)
	})

	it('returns false when title is non-empty', () => {
		expect(is_row_discard_empty({ ...EMPTY_ROW, title: 'Buy milk' })).toBe(false)
	})

	it('returns true when title is empty even if detail is set', () => {
		expect(is_row_discard_empty({ ...EMPTY_ROW, detail: 'some detail' })).toBe(true)
	})

	it('returns true when title is empty even if due_date is set', () => {
		expect(is_row_discard_empty({ ...EMPTY_ROW, due_date: '2026-05-01' })).toBe(true)
	})

	it('returns true when title is empty even if recurrence_rule is set', () => {
		expect(is_row_discard_empty({ ...EMPTY_ROW, recurrence_rule: 'FREQ=DAILY' })).toBe(true)
	})
})
