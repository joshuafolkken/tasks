import type { TaskItem } from '$lib/dash-page-types'

type FilterMode = 'one' | 'and' | 'or'

interface FilterOptions {
	search_query: string
	selected_label_ids: Array<string>
	filter_mode: FilterMode
}

function split_search_tokens(trimmed_query: string): Array<string> {
	return trimmed_query.split(/\s+/u).filter((token) => token.length > 0)
}

function is_task_matching_single_token(task_row: TaskItem, token_lower: string): boolean {
	const is_title_match = task_row.title.toLowerCase().includes(token_lower)
	const is_detail_match = task_row.detail?.toLowerCase().includes(token_lower) ?? false
	const is_label_match = task_row.task_labels.some((row) =>
		row.label.name.toLowerCase().includes(token_lower),
	)

	return is_title_match || is_detail_match || is_label_match
}

function is_task_matching_search(
	task_row: TaskItem,
	trimmed_query: string,
	filter_mode: FilterMode,
): boolean {
	const tokens = split_search_tokens(trimmed_query).map((token) => token.toLowerCase())

	if (tokens.length === 0) return true

	if (tokens.length === 1) return is_task_matching_single_token(task_row, tokens[0] ?? '')

	if (filter_mode === 'or') {
		return tokens.some((token) => is_task_matching_single_token(task_row, token))
	}

	return tokens.every((token) => is_task_matching_single_token(task_row, token))
}

function is_task_matching_label_filter(
	task_row: TaskItem,
	selected_label_ids: Array<string>,
	filter_mode: FilterMode,
): boolean {
	const task_label_id_set = new Set(task_row.task_labels.map((row) => row.label_id))

	if (filter_mode === 'or') {
		return selected_label_ids.some((id) => task_label_id_set.has(id))
	}

	return selected_label_ids.every((id) => task_label_id_set.has(id))
}

function filter_display_tasks(tasks: Array<TaskItem>, options: FilterOptions): Array<TaskItem> {
	const trimmed_query = options.search_query.trim()

	return tasks.filter((task_row) => {
		if (
			trimmed_query !== '' &&
			!is_task_matching_search(task_row, trimmed_query, options.filter_mode)
		) {
			return false
		}

		if (
			options.selected_label_ids.length > 0 &&
			!is_task_matching_label_filter(task_row, options.selected_label_ids, options.filter_mode)
		) {
			return false
		}

		return true
	})
}

const dash_task_filters = {
	filter_display_tasks,
}

export type { FilterMode, FilterOptions }
export { dash_task_filters }
