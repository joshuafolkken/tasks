import { form_utilities } from '$lib/server/utils/form'

interface ParsedCreateTask {
	title: string
	detail: string | undefined
	due_date: string | undefined
	recurrence_rule: string | undefined
	label_names: Array<string>
	insert_after_task_id: string | undefined
	insert_at_top: boolean
}

interface ParsedUpdateTask {
	task_id: string
	title: string
	detail: string | undefined
	due_date: string | undefined
	recurrence_rule: string | undefined
	label_names: Array<string>
}

const ERROR_TASK_ID_REQUIRED = 'タスクIDが必要です'
const ERROR_TITLE_LINES_REQUIRED = 'タイトルを1行以上入力してください'

function read_label_names_from_form(form_data: FormData): Array<string> {
	const raw_values = form_data
		.getAll('labels')
		.map((entry) => form_utilities.get_string(entry).trim())

	return [...new Set(raw_values.filter(Boolean))]
}

function read_insert_after_id(form_data: FormData): string | undefined {
	const raw = form_utilities.get_string(form_data.get('insert_after_task_id')).trim()

	return raw === '' ? undefined : raw
}

function read_create_text_fields(form_data: FormData): {
	detail: string | undefined
	due_date: string | undefined
	recurrence_rule: string | undefined
} {
	const detail_raw = form_utilities.get_string(form_data.get('detail')).trim()
	const due_raw = form_utilities.get_string(form_data.get('due_date')).trim()
	const recurrence_raw = form_utilities.get_string(form_data.get('recurrence_rule')).trim()

	return {
		detail: detail_raw === '' ? undefined : detail_raw,
		due_date: due_raw === '' ? undefined : due_raw,
		recurrence_rule: recurrence_raw === '' ? undefined : recurrence_raw,
	}
}

function split_title_lines(raw_title: string): Array<string> {
	return raw_title
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
}

function parse_create_body(
	form_data: FormData,
): { ok: true; data: ParsedCreateTask } | { ok: false; error: string } {
	const title = form_utilities.get_string(form_data.get('title')).trim()
	const { detail, due_date, recurrence_rule } = read_create_text_fields(form_data)
	const label_names = read_label_names_from_form(form_data)
	const insert_after_task_id = read_insert_after_id(form_data)
	const should_insert_at_top =
		form_utilities.get_string(form_data.get('insert_at_top')).trim() === '1'

	return {
		ok: true,
		data: {
			title,
			detail,
			due_date,
			recurrence_rule,
			label_names,
			insert_after_task_id,
			insert_at_top: should_insert_at_top,
		},
	}
}

function parse_update_task_body(
	form_data: FormData,
): { ok: true; data: ParsedUpdateTask } | { ok: false; error: string } {
	const task_id = form_utilities.get_string(form_data.get('task_id')).trim()
	if (!task_id) return { ok: false, error: ERROR_TASK_ID_REQUIRED }

	const title = form_utilities.get_string(form_data.get('title')).trim()
	const { detail, due_date, recurrence_rule } = read_create_text_fields(form_data)
	const label_names = read_label_names_from_form(form_data)

	return {
		ok: true,
		data: { task_id, title, detail, due_date, recurrence_rule, label_names },
	}
}

function parse_update_task_title_body(
	form_data: FormData,
): { ok: true; task_id: string; title_lines: Array<string> } | { ok: false; error: string } {
	const task_id = form_utilities.get_string(form_data.get('task_id')).trim()
	if (!task_id) return { ok: false, error: ERROR_TASK_ID_REQUIRED }

	const raw_title = form_utilities.get_string(form_data.get('title'))
	const title_lines = split_title_lines(raw_title)

	if (title_lines.length === 0) return { ok: false, error: ERROR_TITLE_LINES_REQUIRED }

	return { ok: true, task_id, title_lines }
}

function parse_complete_body(
	form_data: FormData,
): { ok: true; task_id: string } | { ok: false; error: string } {
	const task_id = form_utilities.get_string(form_data.get('task_id')).trim()
	if (!task_id) return { ok: false, error: ERROR_TASK_ID_REQUIRED }

	return { ok: true, task_id }
}

function parse_reorder_body(form_data: FormData):
	| { ok: true; task_id: string; prev_sort_order: string; next_sort_order: string }
	| {
			ok: false
			error: string
	  } {
	const task_id = form_utilities.get_string(form_data.get('task_id')).trim()
	if (!task_id) return { ok: false, error: ERROR_TASK_ID_REQUIRED }
	const previous_sort_order = form_utilities.get_string(form_data.get('prev_sort_order')).trim()
	const next_sort_order = form_utilities.get_string(form_data.get('next_sort_order')).trim()

	return { ok: true, task_id, prev_sort_order: previous_sort_order, next_sort_order }
}

const dash_form_parse = {
	parse_create_body,
	parse_complete_body,
	parse_reorder_body,
	parse_update_task_body,
	parse_update_task_title_body,
}

export type { ParsedCreateTask, ParsedUpdateTask }
export { dash_form_parse }
