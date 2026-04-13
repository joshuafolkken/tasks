/**
 * Shared Zod schemas used by both `dash-form-parse` (manual) and sveltekit-superforms.
 *
 * Usage with superforms (server-side, Zod v4):
 *   import { superValidate } from 'sveltekit-superforms'
 *   import { zod4 } from 'sveltekit-superforms/adapters'
 *   const form = await superValidate(formData, zod4(create_task_schema))
 */
import { z } from 'zod'

const ERROR_TASK_ID_REQUIRED = 'タスクIDが必要です'

const task_id_schema = z.string().min(1, ERROR_TASK_ID_REQUIRED)

const create_task_schema = z.object({
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

const update_task_schema = z.object({
	task_id: task_id_schema,
	title: z.string().transform((value) => value.trim()),
	detail: z.string().optional(),
	due_date: z.string().optional(),
	recurrence_rule: z.string().optional(),
})

const complete_task_schema = z.object({ task_id: task_id_schema })

const reorder_task_schema = z.object({
	task_id: task_id_schema,
	prev_sort_order: z.string(),
	next_sort_order: z.string(),
})

const dash_form_schemas = {
	create_task_schema,
	update_task_schema,
	complete_task_schema,
	reorder_task_schema,
}

export { dash_form_schemas, ERROR_TASK_ID_REQUIRED }
