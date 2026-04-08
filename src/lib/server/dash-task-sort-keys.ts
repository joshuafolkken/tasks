import type { ParsedCreateTask } from '$lib/server/dash-form-parse'
import { db } from '$lib/server/db'
import { generateKeyBetween } from 'fractional-indexing'

async function next_open_task_sort_key(user_id: string): Promise<string> {
	const last_open_task = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
			),
		orderBy: (task_row, order_ops) => order_ops.desc(task_row.sort_order),
		columns: { sort_order: true },
	})

	// eslint-disable-next-line unicorn/no-useless-undefined -- explicit upper bound for generateKeyBetween
	return generateKeyBetween(last_open_task?.sort_order, undefined)
}

async function first_open_task_sort_key(user_id: string): Promise<string> {
	const first_open_task = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
			),
		orderBy: (task_row, order_ops) => order_ops.asc(task_row.sort_order),
		columns: { sort_order: true },
	})

	return generateKeyBetween(undefined, first_open_task?.sort_order)
}

async function next_sort_order_after_task(user_id: string, after_task_id: string): Promise<string> {
	const after_row = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.id, after_task_id),
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
			),
		columns: { sort_order: true },
	})

	if (!after_row) return await next_open_task_sort_key(user_id)

	const next_row = await db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.user_id, user_id),
				operators.isNull(task_row.completed_at),
				operators.gt(task_row.sort_order, after_row.sort_order),
			),
		orderBy: (task_row, order_ops) => order_ops.asc(task_row.sort_order),
		columns: { sort_order: true },
	})

	return generateKeyBetween(after_row.sort_order, next_row?.sort_order)
}

async function resolve_create_task_sort_order(
	user_id: string,
	parsed: ParsedCreateTask,
): Promise<string> {
	if (parsed.insert_at_top) return await first_open_task_sort_key(user_id)
	if (parsed.insert_after_task_id === undefined) return await next_open_task_sort_key(user_id)

	return await next_sort_order_after_task(user_id, parsed.insert_after_task_id)
}

export {
	first_open_task_sort_key,
	next_open_task_sort_key,
	next_sort_order_after_task,
	resolve_create_task_sort_order,
}
