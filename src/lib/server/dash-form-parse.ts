import { z } from 'zod'

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

const FALLBACK_VALIDATION_ERROR = 'validation error'

function first_issue_message(error: z.ZodError): string {
	const [first] = error.issues

	return first?.message ?? FALLBACK_VALIDATION_ERROR
}

/** Coerce a FormDataEntryValue | null to a trimmed string. */
function form_string(value: FormDataEntryValue | null): string {
	return (typeof value === 'string' ? value : '').trim()
}

/** Return trimmed string or undefined when blank. */
function optional_string(value: FormDataEntryValue | null): string | undefined {
	const trimmed = form_string(value)

	return trimmed === '' ? undefined : trimmed
}

function read_label_names(form_data: FormData): Array<string> {
	const raw_values = form_data.getAll('labels').map((entry) => form_string(entry))

	return [...new Set(raw_values.filter(Boolean))]
}

const create_schema = z.object({
	title: z.string().transform((value) => value.trim()),
	detail: z.string().optional(),
	due_date: z.string().optional(),
	recurrence_rule: z.string().optional(),
	insert_after_task_id: z.string().optional(),
	insert_at_top: z
		.string()
		.optional()
		.transform((value) => value === '1'),
})

function read_create_raw(form_data: FormData): z.input<typeof create_schema> {
	return {
		title: form_string(form_data.get('title')),
		detail: optional_string(form_data.get('detail')),
		due_date: optional_string(form_data.get('due_date')),
		recurrence_rule: optional_string(form_data.get('recurrence_rule')),
		insert_after_task_id: optional_string(form_data.get('insert_after_task_id')),
		insert_at_top: form_string(form_data.get('insert_at_top')),
	}
}

function to_create_task(
	data: z.output<typeof create_schema>,
	form_data: FormData,
): ParsedCreateTask {
	return {
		title: data.title,
		detail: data.detail ?? undefined,
		due_date: data.due_date ?? undefined,
		recurrence_rule: data.recurrence_rule ?? undefined,
		insert_after_task_id: data.insert_after_task_id ?? undefined,
		insert_at_top: data.insert_at_top,
		label_names: read_label_names(form_data),
	}
}

function parse_create_body(
	form_data: FormData,
): { ok: true; data: ParsedCreateTask } | { ok: false; error: string } {
	const result = create_schema.safeParse(read_create_raw(form_data))
	if (!result.success) return { ok: false, error: first_issue_message(result.error) }

	return { ok: true, data: to_create_task(result.data, form_data) }
}

const task_id_schema = z.string().min(1, ERROR_TASK_ID_REQUIRED)

const update_task_schema = z.object({
	task_id: task_id_schema,
	title: z.string().transform((value) => value.trim()),
	detail: z.string().optional(),
	due_date: z.string().optional(),
	recurrence_rule: z.string().optional(),
})

function to_update_task(
	data: z.output<typeof update_task_schema>,
	form_data: FormData,
): ParsedUpdateTask {
	return {
		task_id: data.task_id,
		title: data.title,
		detail: data.detail ?? undefined,
		due_date: data.due_date ?? undefined,
		recurrence_rule: data.recurrence_rule ?? undefined,
		label_names: read_label_names(form_data),
	}
}

function parse_update_task_body(
	form_data: FormData,
): { ok: true; data: ParsedUpdateTask } | { ok: false; error: string } {
	const raw = {
		task_id: form_string(form_data.get('task_id')),
		title: form_string(form_data.get('title')),
		detail: optional_string(form_data.get('detail')),
		due_date: optional_string(form_data.get('due_date')),
		recurrence_rule: optional_string(form_data.get('recurrence_rule')),
	}
	const result = update_task_schema.safeParse(raw)
	if (!result.success) return { ok: false, error: first_issue_message(result.error) }

	return { ok: true, data: to_update_task(result.data, form_data) }
}

const title_lines_schema = z.object({
	task_id: task_id_schema,
	title: z.string(),
})

function split_title_lines(raw_title: string): Array<string> {
	return raw_title
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
}

function parse_update_task_title_body(
	form_data: FormData,
): { ok: true; task_id: string; title_lines: Array<string> } | { ok: false; error: string } {
	const raw_title = form_data.get('title')
	const raw = {
		task_id: form_string(form_data.get('task_id')),
		title: typeof raw_title === 'string' ? raw_title : '',
	}
	const result = title_lines_schema.safeParse(raw)
	if (!result.success) return { ok: false, error: first_issue_message(result.error) }

	const title_lines = split_title_lines(result.data.title)
	if (title_lines.length === 0) return { ok: false, error: ERROR_TITLE_LINES_REQUIRED }

	return { ok: true, task_id: result.data.task_id, title_lines }
}

const complete_schema = z.object({ task_id: task_id_schema })

function parse_complete_body(
	form_data: FormData,
): { ok: true; task_id: string } | { ok: false; error: string } {
	const result = complete_schema.safeParse({ task_id: form_string(form_data.get('task_id')) })
	if (!result.success) return { ok: false, error: first_issue_message(result.error) }

	return { ok: true, task_id: result.data.task_id }
}

const reorder_schema = z.object({
	task_id: task_id_schema,
	prev_sort_order: z.string(),
	next_sort_order: z.string(),
})

function parse_reorder_body(form_data: FormData):
	| { ok: true; task_id: string; prev_sort_order: string; next_sort_order: string }
	| {
			ok: false
			error: string
	  } {
	const raw = {
		task_id: form_string(form_data.get('task_id')),
		prev_sort_order: form_string(form_data.get('prev_sort_order')),
		next_sort_order: form_string(form_data.get('next_sort_order')),
	}
	const result = reorder_schema.safeParse(raw)
	if (!result.success) return { ok: false, error: first_issue_message(result.error) }

	return { ok: true, ...result.data }
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
