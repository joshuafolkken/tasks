import { next_open_task_sort_key } from '$lib/server/dash-task-sort-keys'
import { db } from '$lib/server/db'
import { task, task_label } from '$lib/server/db/schema'
import { recurrence } from '$lib/server/recurrence'
import { and, eq, isNotNull } from 'drizzle-orm'

interface TaskRowForComplete {
	id: string
	title: string
	detail: string | null
	due_date: string | null
	recurrence_rule: string | null
	recurrence_origin_id: string | null
	task_labels: Array<{ label_id: string }>
}

async function copy_labels_to_task(
	next_task_id: string,
	labels: Array<{ label_id: string }>,
): Promise<void> {
	for (const task_label_row of labels) {
		await db.insert(task_label).values({ task_id: next_task_id, label_id: task_label_row.label_id })
	}
}

async function insert_recurrence_followup(
	user_id: string,
	existing_task: TaskRowForComplete,
	next_due_iso: string,
): Promise<void> {
	const sort_order = await next_open_task_sort_key(user_id)
	const next_task_id = crypto.randomUUID()

	await db.insert(task).values({
		id: next_task_id,
		user_id,
		title: existing_task.title,
		detail: existing_task.detail,
		sort_order,
		due_date: next_due_iso,
		recurrence_rule: existing_task.recurrence_rule,
		recurrence_origin_id: existing_task.recurrence_origin_id ?? existing_task.id,
	})

	await copy_labels_to_task(next_task_id, existing_task.task_labels)
}

async function apply_task_complete(
	user_id: string,
	existing_task: TaskRowForComplete,
): Promise<void> {
	await db.update(task).set({ completed_at: new Date() }).where(eq(task.id, existing_task.id))

	if (!existing_task.recurrence_rule) return

	const after = existing_task.due_date ? new Date(existing_task.due_date) : new Date()
	const next_due_iso = recurrence.next_due(existing_task.recurrence_rule, after)

	if (!next_due_iso) return

	await insert_recurrence_followup(user_id, existing_task, next_due_iso)
}

async function delete_completed_task(
	user_id: string,
	task_id: string,
): Promise<'deleted' | 'not_found' | 'not_completed'> {
	const existing_row = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(operators.eq(task_row.id, task_id), operators.eq(task_row.user_id, user_id)),
		columns: { completed_at: true },
	})

	if (!existing_row) return 'not_found'
	if (!existing_row.completed_at) return 'not_completed'

	await db
		.delete(task)
		.where(and(eq(task.id, task_id), eq(task.user_id, user_id), isNotNull(task.completed_at)))

	return 'deleted'
}

async function restore_completed_task(
	user_id: string,
	task_id: string,
): Promise<'ok' | 'not_found' | 'not_completed'> {
	const existing_row = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(operators.eq(task_row.id, task_id), operators.eq(task_row.user_id, user_id)),
		columns: { completed_at: true },
	})

	if (!existing_row) return 'not_found'
	if (!existing_row.completed_at) return 'not_completed'

	const sort_order = await next_open_task_sort_key(user_id)

	/* eslint-disable unicorn/no-null -- completed_at null clears completion in D1 */
	await db
		.update(task)
		.set({ completed_at: null, sort_order })
		.where(and(eq(task.id, task_id), eq(task.user_id, user_id)))
	/* eslint-enable unicorn/no-null */

	return 'ok'
}

interface OpenTaskContentRow {
	title: string
	detail: string | null
	due_date: string | null
	recurrence_rule: string | null
}

function is_row_discard_empty(row: OpenTaskContentRow): boolean {
	return row.title.trim() === ''
}

async function load_open_task_content(
	user_id: string,
	task_id: string,
): Promise<OpenTaskContentRow | undefined> {
	return await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.id, task_id),
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
			),
		columns: {
			title: true,
			detail: true,
			due_date: true,
			recurrence_rule: true,
		},
	})
}

async function delete_open_empty_task(
	user_id: string,
	task_id: string,
): Promise<'deleted' | 'not_found' | 'not_empty'> {
	const row = await load_open_task_content(user_id, task_id)

	if (!row) return 'not_found'
	if (!is_row_discard_empty(row)) return 'not_empty'

	await db.delete(task_label).where(eq(task_label.task_id, task_id))
	await db.delete(task).where(and(eq(task.id, task_id), eq(task.user_id, user_id)))

	return 'deleted'
}

export type { TaskRowForComplete }
export {
	apply_task_complete,
	copy_labels_to_task,
	delete_completed_task,
	delete_open_empty_task,
	is_row_discard_empty,
	restore_completed_task,
}
