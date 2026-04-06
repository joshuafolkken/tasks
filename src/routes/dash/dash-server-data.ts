import { dash_label_lists } from '$lib/server/dash-label-lists'
import { db } from '$lib/server/db'

/* Relational `with` fields are lost if we annotate with `ReturnType<typeof findMany/findFirst>`. */
/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */

function fetch_user_tasks_with_labels(user_id: string, is_completed_view: boolean) {
	return db.query.task.findMany({
		where: (task_row, operators) =>
			operators.and(
				operators.eq(task_row.user_id, user_id),
				is_completed_view
					? operators.isNotNull(task_row.completed_at)
					: operators.isNull(task_row.completed_at),
			),
		with: {
			task_labels: {
				with: { label: true },
			},
		},
		orderBy: is_completed_view
			? (task_row, order_ops) => order_ops.desc(task_row.completed_at)
			: (task_row, order_ops) => order_ops.asc(task_row.sort_order),
	})
}

function fetch_user_labels(user_id: string) {
	return db.query.label.findMany({
		where: (label_row, operators) => operators.eq(label_row.user_id, user_id),
		orderBy: (label_row, order_ops) => order_ops.asc(label_row.name),
	})
}

async function load_dash_label_lists(user_id: string) {
	return await dash_label_lists.load_dash_label_lists(user_id, fetch_user_labels)
}

function find_task_with_labels_for_user(task_id: string, user_id: string) {
	return db.query.task.findFirst({
		where: (task_row, operators) =>
			operators.and(operators.eq(task_row.id, task_id), operators.eq(task_row.user_id, user_id)),
		with: { task_labels: true },
	})
}

const dash_server_data = {
	fetch_user_tasks_with_labels,
	fetch_user_labels,
	load_dash_label_lists,
	find_task_with_labels_for_user,
}

/* eslint-enable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */

export { dash_server_data }
