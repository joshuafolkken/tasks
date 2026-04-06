import { m } from '$lib/paraglide/messages'
import { task_rrule, type TaskRruleFreq } from './task-rrule'

const SINGLE_INTERVAL = 1

function daily_single(): string {
	return m.dash_recurrence_daily()
}

function weekly_single(): string {
	return m.dash_recurrence_weekly()
}

function monthly_date_single(): string {
	return m.dash_recurrence_monthly_date()
}

function monthly_weekday_single(): string {
	return m.dash_recurrence_monthly_weekday()
}

function yearly_single(): string {
	return m.dash_recurrence_yearly()
}

const SINGLE_BY_FREQ: Record<Exclude<TaskRruleFreq, 'none'>, () => string> = {
	daily: daily_single,
	weekly: weekly_single,
	monthly_date: monthly_date_single,
	monthly_weekday: monthly_weekday_single,
	yearly: yearly_single,
}

function daily_multi(interval_text: string): string {
	return m.dash_recurrence_summary_ndays({ n: interval_text })
}

function weekly_multi(interval_text: string): string {
	return m.dash_recurrence_summary_nweeks({ n: interval_text })
}

function monthly_multi(interval_text: string): string {
	return m.dash_recurrence_summary_nmonths({ n: interval_text })
}

function yearly_multi(interval_text: string): string {
	return m.dash_recurrence_summary_nyears({ n: interval_text })
}

const MULTI_BY_FREQ: Record<Exclude<TaskRruleFreq, 'none'>, (n: string) => string> = {
	daily: daily_multi,
	weekly: weekly_multi,
	monthly_date: monthly_multi,
	monthly_weekday: monthly_multi,
	yearly: yearly_multi,
}

/** Return a locale-aware compact summary for an rrule string, or '' if empty/invalid. */
function format_rrule_summary(rrule: string): string {
	const state = task_rrule.parse_to_state(rrule)

	if (state === undefined || state.freq === 'none') return ''
	if (state.interval <= SINGLE_INTERVAL) return SINGLE_BY_FREQ[state.freq]()

	return MULTI_BY_FREQ[state.freq](String(state.interval))
}

const rrule_summary = { format_rrule_summary }
export { rrule_summary }
