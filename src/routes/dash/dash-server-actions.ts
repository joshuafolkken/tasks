import { m } from '$lib/paraglide/messages'
import { err, ok, type Result } from '$lib/result'
import type { ParsedCreateTask, ParsedUpdateTask } from '$lib/server/dash-form-parse'
import {
	apply_task_complete,
	copy_labels_to_task,
	delete_completed_task,
	delete_open_empty_task,
	restore_completed_task,
} from '$lib/server/dash-task-completion'
import {
	next_sort_order_after_task,
	resolve_create_task_sort_order,
} from '$lib/server/dash-task-sort-keys'
import { db } from '$lib/server/db'
import { label, task, task_label } from '$lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { generateKeyBetween } from 'fractional-indexing'

async function resolve_label_id(user_id: string, name: string): Promise<string> {
	const existing_label = await db.query.label.findFirst({
		where: (label_row, operators) =>
			operators.and(operators.eq(label_row.user_id, user_id), operators.eq(label_row.name, name)),
	})

	if (existing_label) return existing_label.id

	const label_id = crypto.randomUUID()

	await db.insert(label).values({ id: label_id, user_id, name })

	return label_id
}

async function link_label_names_to_task(
	user_id: string,
	task_id: string,
	label_names: Array<string>,
): Promise<void> {
	for (const name of label_names) {
		const label_id = await resolve_label_id(user_id, name)

		await db.insert(task_label).values({ task_id, label_id })
	}
}

async function apply_open_task_field_update(parsed: ParsedUpdateTask): Promise<void> {
	/* eslint-disable unicorn/no-null -- Drizzle uses null for SQL NULL on nullable text columns */
	await db
		.update(task)
		.set({
			title: parsed.title,
			detail: parsed.detail ?? null,
			due_date: parsed.due_date ?? null,
			recurrence_rule: parsed.recurrence_rule ?? null,
		})
		.where(eq(task.id, parsed.task_id))
	/* eslint-enable unicorn/no-null */
}

async function replace_task_labels(
	user_id: string,
	task_id: string,
	label_names: Array<string>,
): Promise<void> {
	await db.delete(task_label).where(eq(task_label.task_id, task_id))
	await link_label_names_to_task(user_id, task_id, label_names)
}

async function create_task_row(user_id: string, parsed: ParsedCreateTask): Promise<string> {
	const sort_order = await resolve_create_task_sort_order(user_id, parsed)

	const task_id = crypto.randomUUID()

	await db.insert(task).values({
		id: task_id,
		user_id,
		title: parsed.title,
		detail: parsed.detail,
		sort_order,
		due_date: parsed.due_date,
		recurrence_rule: parsed.recurrence_rule,
	})

	await link_label_names_to_task(user_id, task_id, parsed.label_names)

	return task_id
}

async function update_open_task_row(
	user_id: string,
	parsed: ParsedUpdateTask,
): Promise<'ok' | 'not_found'> {
	const existing_row = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.id, parsed.task_id),
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
			),
		columns: { id: true },
	})

	if (!existing_row) return 'not_found'

	await apply_open_task_field_update(parsed)
	await replace_task_labels(user_id, parsed.task_id, parsed.label_names)

	return 'ok'
}

async function insert_open_task_after(
	user_id: string,
	after_task_id: string,
	title: string,
	label_links: Array<{ label_id: string }>,
): Promise<string> {
	const sort_order = await next_sort_order_after_task(user_id, after_task_id)
	const new_task_id = crypto.randomUUID()

	await db.insert(task).values({
		id: new_task_id,
		user_id,
		title,
		sort_order,
	})

	await copy_labels_to_task(new_task_id, label_links)

	return new_task_id
}

async function append_extra_title_line_tasks(
	user_id: string,
	start_after_id: string,
	extra_titles: Array<string>,
	label_links: Array<{ label_id: string }>,
): Promise<string | undefined> {
	let anchor_id = start_after_id
	let focus_task_id: string | undefined = undefined

	for (const extra_title of extra_titles) {
		anchor_id = await insert_open_task_after(user_id, anchor_id, extra_title, label_links)
		focus_task_id = anchor_id
	}

	return focus_task_id
}

async function apply_task_title_lines_update(
	user_id: string,
	task_id: string,
	title_lines: Array<string>,
): Promise<Result<string | undefined, 'not_found'>> {
	const existing_row = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.id, task_id),
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
			),
		with: { task_labels: true },
	})

	if (!existing_row) return err('not_found' as const)

	await db.update(task).set({ title: title_lines[0] }).where(eq(task.id, task_id))

	const focus_task_id = await append_extra_title_line_tasks(
		user_id,
		task_id,
		title_lines.slice(1),
		existing_row.task_labels,
	)

	return ok(focus_task_id)
}

async function seed_open_tasks_at_top(user_id: string, titles: Array<string>): Promise<void> {
	for (const title of titles) {
		const parsed: ParsedCreateTask = {
			title,
			detail: undefined,
			due_date: undefined,
			recurrence_rule: undefined,
			label_names: [],
			insert_after_task_id: undefined,
			insert_at_top: true,
		}

		await create_task_row(user_id, parsed)
	}
}

function compute_reorder_sort_order(
	previous_sort_order: string,
	next_sort_order: string,
): Result<string, string> {
	try {
		const sort_order = generateKeyBetween(
			previous_sort_order === '' ? undefined : previous_sort_order,
			next_sort_order === '' ? undefined : next_sort_order,
		)

		return ok(sort_order)
	} catch {
		return err(m.dash_error_reorder_failed())
	}
}

const dash_server_actions = {
	create_task_row,
	seed_open_tasks_at_top,
	update_open_task_row,
	apply_task_title_lines_update,
	apply_task_complete,
	delete_completed_task,
	delete_open_empty_task,
	restore_completed_task,
	compute_reorder_sort_order,
}

export type { TaskRowForComplete } from '$lib/server/dash-task-completion'
export { dash_server_actions }
