type TaskRruleFreq = 'none' | 'daily' | 'weekly' | 'monthly_date' | 'monthly_weekday' | 'yearly'

interface TaskRruleState {
	freq: TaskRruleFreq
	interval: number
	days: Array<string>
	month_day: number
	wp_pos: number
	wp_day: string
	year_month: number
	year_day: number
}

const RRULE_FREQ_MONTHLY = 'FREQ=MONTHLY'

type FreqBuilder = (state: TaskRruleState, parts: Array<string>) => void

function append_interval_if_needed(parts: Array<string>, interval: number): void {
	if (interval > 1) parts.push(`INTERVAL=${String(interval)}`)
}

function build_daily(state: TaskRruleState, parts: Array<string>): void {
	parts.push('FREQ=DAILY')
	append_interval_if_needed(parts, state.interval)
}

function build_weekly(state: TaskRruleState, parts: Array<string>): void {
	parts.push('FREQ=WEEKLY')
	append_interval_if_needed(parts, state.interval)
	if (state.days.length > 0) parts.push(`BYDAY=${state.days.join(',')}`)
}

function build_monthly_date(state: TaskRruleState, parts: Array<string>): void {
	parts.push(RRULE_FREQ_MONTHLY)
	append_interval_if_needed(parts, state.interval)
	parts.push(`BYMONTHDAY=${String(state.month_day)}`)
}

function build_monthly_weekday(state: TaskRruleState, parts: Array<string>): void {
	parts.push(RRULE_FREQ_MONTHLY)
	append_interval_if_needed(parts, state.interval)
	parts.push(`BYDAY=${state.wp_day}`, `BYSETPOS=${String(state.wp_pos)}`)
}

function build_yearly(state: TaskRruleState, parts: Array<string>): void {
	parts.push(
		'FREQ=YEARLY',
		`BYMONTH=${String(state.year_month)}`,
		`BYMONTHDAY=${String(state.year_day)}`,
	)
	append_interval_if_needed(parts, state.interval)
}

const freq_builders: Record<Exclude<TaskRruleFreq, 'none'>, FreqBuilder> = {
	daily: build_daily,
	weekly: build_weekly,
	monthly_date: build_monthly_date,
	monthly_weekday: build_monthly_weekday,
	yearly: build_yearly,
}

function build(state: TaskRruleState): string {
	if (state.freq === 'none') return ''
	const parts: Array<string> = []

	freq_builders[state.freq](state, parts)

	return parts.join(';')
}

const RRULE_INTERVAL_MIN = 1
const RRULE_INTERVAL_MAX = 99

function put_rrule_segment(map: Map<string, string>, trimmed: string): void {
	const eq = trimmed.indexOf('=')
	if (eq === -1) return

	map.set(trimmed.slice(0, eq).toUpperCase(), trimmed.slice(eq + 1))
}

function parse_rrule_pairs(rrule: string): Map<string, string> {
	const map = new Map<string, string>()

	for (const part of rrule.trim().split(';')) {
		const trimmed = part.trim()
		if (trimmed !== '') put_rrule_segment(map, trimmed)
	}

	return map
}

function read_interval_from_map(map: Map<string, string>): number {
	const raw = map.get('INTERVAL')
	if (raw === undefined) return 1

	const interval_number = Number(raw)

	if (
		!Number.isFinite(interval_number) ||
		interval_number < RRULE_INTERVAL_MIN ||
		interval_number > RRULE_INTERVAL_MAX
	) {
		return 1
	}

	return interval_number
}

function empty_rrule_state(): TaskRruleState {
	return {
		freq: 'none',
		interval: 1,
		days: [],
		month_day: 1,
		wp_pos: 1,
		wp_day: 'MO',
		year_month: 1,
		year_day: 1,
	}
}

function parse_weekly_from_map(map: Map<string, string>, base: TaskRruleState): TaskRruleState {
	const byday = map.get('BYDAY')
	const days = byday
		? byday
				.split(',')
				.map((code) => code.trim())
				.filter((code) => code !== '')
		: []

	return { ...base, freq: 'weekly', interval: read_interval_from_map(map), days }
}

function read_monthly_wp_pos(map: Map<string, string>): number {
	const raw = Number(map.get('BYSETPOS'))

	return Number.isFinite(raw) ? raw : 1
}

function read_monthly_wp_day(map: Map<string, string>): string {
	const raw = map.get('BYDAY')?.split(',')[0]?.trim() ?? 'MO'

	return raw === '' ? 'MO' : raw
}

function parse_monthly_weekday_from_map(
	map: Map<string, string>,
	base: TaskRruleState,
): TaskRruleState {
	return {
		...base,
		freq: 'monthly_weekday',
		interval: read_interval_from_map(map),
		wp_pos: read_monthly_wp_pos(map),
		wp_day: read_monthly_wp_day(map),
	}
}

function parse_monthly_date_from_map(
	map: Map<string, string>,
	base: TaskRruleState,
): TaskRruleState {
	const month_day = Number(map.get('BYMONTHDAY'))

	return {
		...base,
		freq: 'monthly_date',
		interval: read_interval_from_map(map),
		month_day: Number.isFinite(month_day) ? month_day : 1,
	}
}

function parse_monthly_from_map(map: Map<string, string>, base: TaskRruleState): TaskRruleState {
	if (map.has('BYSETPOS')) return parse_monthly_weekday_from_map(map, base)

	return parse_monthly_date_from_map(map, base)
}

function parse_yearly_from_map(map: Map<string, string>, base: TaskRruleState): TaskRruleState {
	const year_month = Number(map.get('BYMONTH'))
	const year_day = Number(map.get('BYMONTHDAY'))

	return {
		...base,
		freq: 'yearly',
		interval: read_interval_from_map(map),
		year_month: Number.isFinite(year_month) ? year_month : 1,
		year_day: Number.isFinite(year_day) ? year_day : 1,
	}
}

function parse_by_freq(
	freq_raw: string | undefined,
	map: Map<string, string>,
	base: TaskRruleState,
): TaskRruleState | undefined {
	if (freq_raw === 'DAILY') return { ...base, freq: 'daily', interval: read_interval_from_map(map) }
	if (freq_raw === 'WEEKLY') return parse_weekly_from_map(map, base)
	if (freq_raw === 'MONTHLY') return parse_monthly_from_map(map, base)
	if (freq_raw === 'YEARLY') return parse_yearly_from_map(map, base)

	return undefined
}

/** Hydrate editor state from an RRULE string built by {@link build}; unknown shapes return `undefined`. */
function parse_to_state(rrule: string): TaskRruleState | undefined {
	const trimmed = rrule.trim()
	if (trimmed === '') return undefined

	const map = parse_rrule_pairs(trimmed)

	return parse_by_freq(map.get('FREQ')?.toUpperCase(), map, empty_rrule_state())
}

const task_rrule = {
	build,
	parse_to_state,
}

export type { TaskRruleFreq, TaskRruleState }
export { task_rrule }
