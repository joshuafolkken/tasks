import { describe, expect, it, vi } from 'vitest'
import { rrule_summary } from './rrule-summary'

interface IntervalMessage {
	n: string
}

function mock_rrule_interval_label(unit: string): (payload: IntervalMessage) => string {
	return ({ n }: IntervalMessage) => `Every ${n} ${unit}(s)`
}

const hoisted = vi.hoisted(() => {
	const LABEL_MONTHLY_DATE = 'Monthly (date)'
	const LABEL_MONTHLY_WEEKDAY = 'Monthly (weekday)'

	return { LABEL_MONTHLY_DATE, LABEL_MONTHLY_WEEKDAY }
})

vi.mock('$lib/paraglide/messages', () => ({
	m: {
		dash_recurrence_daily: () => 'Daily',
		dash_recurrence_weekly: () => 'Weekly',
		dash_recurrence_monthly_date: () => hoisted.LABEL_MONTHLY_DATE,
		dash_recurrence_monthly_weekday: () => hoisted.LABEL_MONTHLY_WEEKDAY,
		dash_recurrence_yearly: () => 'Yearly',
		dash_recurrence_summary_ndays: mock_rrule_interval_label('day'),
		dash_recurrence_summary_nweeks: mock_rrule_interval_label('week'),
		dash_recurrence_summary_nmonths: mock_rrule_interval_label('month'),
		dash_recurrence_summary_nyears: mock_rrule_interval_label('year'),
	},
}))

const { format_rrule_summary } = rrule_summary

describe('rrule_summary.format_rrule_summary', () => {
	const SINGLE_EXPECTATIONS: Array<[string, string]> = [
		['FREQ=DAILY', 'Daily'],
		['FREQ=WEEKLY', 'Weekly'],
		['FREQ=MONTHLY;BYMONTHDAY=1', hoisted.LABEL_MONTHLY_DATE],
		['FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1', hoisted.LABEL_MONTHLY_WEEKDAY],
		['FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1', 'Yearly'],
	]

	it.each(SINGLE_EXPECTATIONS)('summarizes %s as %s', (rrule, expected) => {
		expect(format_rrule_summary(rrule)).toBe(expected)
	})

	it('returns empty string for empty rrule', () => {
		expect(format_rrule_summary('')).toBe('')
	})

	it('returns empty string for invalid rrule', () => {
		expect(format_rrule_summary('NOT_A_RRULE')).toBe('')
	})

	const INTERVAL_EXPECTATIONS: Array<[string, string]> = [
		['FREQ=DAILY;INTERVAL=3', 'Every 3 day(s)'],
		['FREQ=WEEKLY;INTERVAL=2', 'Every 2 week(s)'],
		['FREQ=MONTHLY;BYMONTHDAY=15;INTERVAL=2', 'Every 2 month(s)'],
		['FREQ=MONTHLY;BYDAY=MO;BYSETPOS=1;INTERVAL=3', 'Every 3 month(s)'],
		['FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1;INTERVAL=2', 'Every 2 year(s)'],
	]

	it.each(INTERVAL_EXPECTATIONS)('summarizes interval rule %s', (rrule, expected) => {
		expect(format_rrule_summary(rrule)).toBe(expected)
	})
})
