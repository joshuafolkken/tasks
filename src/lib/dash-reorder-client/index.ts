import type { TaskItem } from '$lib/dash-page-types'

function normalized_sort_key(raw: string | undefined): string | undefined {
	if (raw === undefined || raw === '') return undefined

	return raw
}

function neighbor_sort_keys(
	items: Array<TaskItem>,
	moved_index: number,
): { previous: string | undefined; next: string | undefined } {
	const previous_raw = moved_index > 0 ? items[moved_index - 1]?.sort_order : undefined
	const next_raw = moved_index < items.length - 1 ? items[moved_index + 1]?.sort_order : undefined

	return {
		previous: normalized_sort_key(previous_raw),
		next: normalized_sort_key(next_raw),
	}
}

/** Drop Y vs row midpoint: upper half → before this row; lower half → before next (or end). */
function pick_insert_before_at_drop(input: {
	ordered_task_ids: ReadonlyArray<string>
	target_task_id: string
	pointer_client_y: number
	row_client_top: number
	row_client_height: number
}): string | undefined {
	if (input.row_client_height <= 0) return input.target_task_id

	/* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- row midpoint = half height */
	const midpoint_y = input.row_client_top + input.row_client_height / 2
	const is_before_mid_row = input.pointer_client_y < midpoint_y
	const index = input.ordered_task_ids.indexOf(input.target_task_id)

	if (index === -1) return undefined
	if (is_before_mid_row) return input.ordered_task_ids[index]
	if (index === input.ordered_task_ids.length - 1) return undefined

	return input.ordered_task_ids[index + 1]
}

/** Move `dragged_id` to appear immediately before `insert_before_id`. */
function reorder_with_insert_before(
	list: ReadonlyArray<TaskItem>,
	dragged_id: string,
	insert_before_id: string,
): Array<TaskItem> {
	const dragged_index = list.findIndex((row) => row.id === dragged_id)
	const target_index = list.findIndex((row) => row.id === insert_before_id)

	if (dragged_index === -1 || target_index === -1 || dragged_id === insert_before_id) {
		return [...list]
	}

	const copy = [...list]
	const [removed] = copy.splice(dragged_index, 1)
	if (removed === undefined) return [...list]

	const insert_at = copy.findIndex((row) => row.id === insert_before_id)

	copy.splice(insert_at, 0, removed)

	return copy
}

/** Move `dragged_id` to the end of the list. */
function move_task_to_end(list: ReadonlyArray<TaskItem>, dragged_id: string): Array<TaskItem> {
	const dragged_index = list.findIndex((row) => row.id === dragged_id)

	if (dragged_index === -1) return [...list]

	const copy = [...list]
	const [removed] = copy.splice(dragged_index, 1)
	if (removed === undefined) return [...list]

	copy.push(removed)

	return copy
}

const json_action_headers: HeadersInit = {
	accept: 'application/json',
	'x-sveltekit-action': 'true',
}

async function post_task_reorder(
	page_pathname: string,
	dropped_items: Array<TaskItem>,
	moved_task_id: string,
): Promise<void> {
	const moved_index = dropped_items.findIndex((row) => row.id === moved_task_id)
	const { previous, next } = neighbor_sort_keys(dropped_items, moved_index)
	const form_data = new FormData()

	form_data.set('task_id', moved_task_id)
	if (previous !== undefined) form_data.set('prev_sort_order', previous)
	if (next !== undefined) form_data.set('next_sort_order', next)
	await fetch(`${page_pathname}?/reorder`, {
		method: 'POST',
		headers: json_action_headers,
		body: form_data,
	})
}

const dash_reorder_client = {
	post_task_reorder,
	reorder_with_insert_before,
	move_task_to_end,
	pick_insert_before_at_drop,
}

export { dash_reorder_client }
