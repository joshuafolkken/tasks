import type { ActionResult } from '@sveltejs/kit'
import { m } from '$lib/paraglide/messages'
import { rrule_summary } from '$lib/rrule-summary'

const LABEL_SUGGESTION_LIMIT = 5
const LABEL_BLUR_DELAY_MS = 150
const BLUR_COMMIT_DELAY_MS = 120
const POINTER_UP_SETTLE_MS = 16
const RRULE_BUTTON_DISPLAY_MAX_CHARS = 48
const DETAIL_MIN_HEIGHT_PX = 36
const DIALOG_RECURRENCE_CLASS =
	'fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-600 dark:bg-gray-800'

interface LabelItem {
	id: string
	name: string
}

function is_plain_object(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object'
}

function read_optional_string_field(payload: unknown, field: string): string | undefined {
	if (!is_plain_object(payload) || !(field in payload)) return undefined

	const value = payload[field]

	return typeof value === 'string' ? value : undefined
}

function read_action_error(result: ActionResult): string {
	if (result.type !== 'failure') return m.dash_create_error_default()

	return read_optional_string_field(result.data, 'error') ?? m.dash_create_error_default()
}

function truncate_rule_for_button(raw: string): string {
	if (raw.length <= RRULE_BUTTON_DISPLAY_MAX_CHARS) return raw

	return `${raw.slice(0, RRULE_BUTTON_DISPLAY_MAX_CHARS - 1)}…`
}

function format_recurrence_button_text(rrule: string): string {
	if (!rrule.trim()) return ''

	const summary = rrule_summary.format_rrule_summary(rrule)
	if (summary !== '') return summary

	return m.dash_recurrence_unparsed_display({ rule: truncate_rule_for_button(rrule) })
}

function format_due_date_display(due_date: string): string {
	if (!due_date) return ''

	return new Date(`${due_date}T12:00:00`).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

function sync_textarea_height(element: HTMLTextAreaElement | undefined): void {
	if (!element) return

	element.style.height = 'auto'
	element.style.height = `${String(Math.max(element.scrollHeight, DETAIL_MIN_HEIGHT_PX))}px`
}

function is_focus_still_inside_form(
	form_element: HTMLFormElement | undefined,
	related?: Node,
): boolean {
	return related !== undefined && Boolean(form_element?.contains(related))
}

function compute_pending_new_labels(
	selected: ReadonlyArray<string>,
	existing: ReadonlyArray<LabelItem>,
): Array<string> {
	return selected.filter((name) => !existing.some((label) => label.name === name))
}

function compute_label_suggestions(
	input: string,
	labels: ReadonlyArray<LabelItem>,
	selected: ReadonlyArray<string>,
): Array<LabelItem> {
	if (!input.trim()) return []

	return labels
		.filter(
			(label) =>
				label.name.toLowerCase().includes(input.toLowerCase()) && !selected.includes(label.name),
		)
		.slice(0, LABEL_SUGGESTION_LIMIT)
}

const dash_task_form_shared = {
	read_action_error,
	truncate_rule_for_button,
	format_recurrence_button_text,
	format_due_date_display,
	sync_textarea_height,
	is_focus_still_inside_form,
	compute_pending_new_labels,
	compute_label_suggestions,
}

export {
	LABEL_SUGGESTION_LIMIT,
	LABEL_BLUR_DELAY_MS,
	BLUR_COMMIT_DELAY_MS,
	POINTER_UP_SETTLE_MS,
	RRULE_BUTTON_DISPLAY_MAX_CHARS,
	DIALOG_RECURRENCE_CLASS,
	dash_task_form_shared,
}
export type { LabelItem }
