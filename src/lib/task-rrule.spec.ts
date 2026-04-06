import { describe, expect, it } from 'vitest'
import { task_rrule, type TaskRruleState } from './task-rrule'

const base: TaskRruleState = {
	freq: 'none',
	interval: 1,
	days: [],
	month_day: 1,
	wp_pos: 1,
	wp_day: 'MO',
	year_month: 1,
	year_day: 1,
}

describe('task_rrule.build', () => {
	it('returns empty string when freq is none', () => {
		expect(task_rrule.build(base)).toBe('')
	})

	it('builds daily rule with optional interval', () => {
		expect(task_rrule.build({ ...base, freq: 'daily' })).toBe('FREQ=DAILY')
		expect(task_rrule.build({ ...base, freq: 'daily', interval: 3 })).toBe('FREQ=DAILY;INTERVAL=3')
	})

	it('builds weekly rule with BYDAY', () => {
		expect(task_rrule.build({ ...base, freq: 'weekly', days: ['MO', 'WE'] })).toBe(
			'FREQ=WEEKLY;BYDAY=MO,WE',
		)
	})

	it('builds monthly date rule', () => {
		expect(task_rrule.build({ ...base, freq: 'monthly_date', month_day: 15 })).toBe(
			'FREQ=MONTHLY;BYMONTHDAY=15',
		)
	})

	it('builds monthly weekday rule', () => {
		expect(task_rrule.build({ ...base, freq: 'monthly_weekday', wp_pos: 2, wp_day: 'FR' })).toBe(
			'FREQ=MONTHLY;BYDAY=FR;BYSETPOS=2',
		)
	})

	it('builds yearly rule', () => {
		expect(task_rrule.build({ ...base, freq: 'yearly', year_month: 12, year_day: 31 })).toBe(
			'FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=31',
		)
	})

	it('builds yearly rule with interval', () => {
		expect(
			task_rrule.build({ ...base, freq: 'yearly', year_month: 1, year_day: 1, interval: 2 }),
		).toBe('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1;INTERVAL=2')
	})
})

describe('task_rrule.parse_to_state', () => {
	it('returns undefined for empty input', () => {
		expect(task_rrule.parse_to_state('')).toBeUndefined()
		expect(task_rrule.parse_to_state('   ')).toBeUndefined()
	})

	it('round-trips build output for each freq variant', () => {
		const variants: Array<TaskRruleState> = [
			{ ...base, freq: 'daily' },
			{ ...base, freq: 'daily', interval: 3 },
			{ ...base, freq: 'weekly', days: ['MO', 'WE'] },
			{ ...base, freq: 'monthly_date', month_day: 15 },
			{ ...base, freq: 'monthly_weekday', wp_pos: 2, wp_day: 'FR' },
			{ ...base, freq: 'yearly', year_month: 12, year_day: 31 },
			{ ...base, freq: 'yearly', year_month: 1, year_day: 1, interval: 2 },
		]

		for (const state of variants) {
			const built = task_rrule.build(state)
			const parsed = task_rrule.parse_to_state(built)

			expect(parsed, built).toEqual(state)
		}
	})
})
