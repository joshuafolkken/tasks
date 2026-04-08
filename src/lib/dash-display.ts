const LABEL_COLOR_CLASSES = [
	'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
	'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
	'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
	'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
	'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
	'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
	'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
	'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
] as const

const STRING_HASH_PRIME = 31

function label_color(name: string): string {
	let hash = 0

	for (const char of name) {
		const code = char.codePointAt(0)

		if (code !== undefined) {
			hash = Math.trunc(hash * STRING_HASH_PRIME + code)
		}
	}

	return LABEL_COLOR_CLASSES[Math.abs(hash) % LABEL_COLOR_CLASSES.length] ?? LABEL_COLOR_CLASSES[0]
}

const MS_PER_DAY = 86_400_000

function due_relative_text(diff_days: number): string {
	if (diff_days === 0) return '今日'
	if (diff_days === 1) return '明日'
	if (diff_days === -1) return '昨日'
	if (diff_days > 0) return `${String(diff_days)}日後`

	return `${String(-diff_days)}日前`
}

const label_chip_base =
	'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors'

const label_chip_inactive_class = `${label_chip_base} bg-gray-100 text-gray-600 ring-transparent hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`

/** Search / editor: same size and shape; only colors (and ring hue) change when selected. */
function label_chip_filter_class(name: string, is_selected: boolean): string {
	return is_selected
		? `${label_chip_base} ${label_color(name)} ring-current outline outline-1 -outline-offset-1 outline-gray-900/20 dark:outline-white/25`
		: label_chip_inactive_class
}

/** Locale-aware completion timestamp for completed-task rows. */
function format_completed_at(completed_at: string | Date, locale: string): string {
	const date = typeof completed_at === 'string' ? new Date(completed_at) : completed_at

	return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
}

function format_due(
	due_date: string | null | undefined,
): { text: string; is_overdue: boolean } | undefined {
	if (!due_date) return undefined
	const today = new Date()

	today.setHours(0, 0, 0, 0)
	const due_day = new Date(due_date)
	const diff_days = Math.round((due_day.getTime() - today.getTime()) / MS_PER_DAY)
	const is_overdue = diff_days < 0
	const text = due_relative_text(diff_days)

	return { text, is_overdue }
}

const dash_display = {
	label_color,
	label_chip_filter_class,
	format_due,
	format_completed_at,
}

export { dash_display }
