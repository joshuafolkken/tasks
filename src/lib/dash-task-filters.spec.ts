/* eslint-disable unicorn/no-null -- Task rows mirror Drizzle nullability */
import { describe, expect, it } from 'vitest'
import type { TaskItem } from './dash-page-types'
import { dash_task_filters } from './dash-task-filters'

const QUERY_ALPHA_BETA = 'alpha beta'

function build_task_row(fields: {
	id?: string
	title: string
	task_labels?: Array<{ label_id: string; label: { name: string } }>
}): TaskItem {
	const task_id = fields.id ?? 't1'
	const task_labels: TaskItem['task_labels'] = (fields.task_labels ?? []).map((row) => ({
		task_id,
		label_id: row.label_id,
		label: {
			id: row.label_id,
			name: row.label.name,
			user_id: 'u1',
		},
	}))

	const row: TaskItem = {
		id: task_id,
		user_id: 'u1',
		title: fields.title,
		detail: null,
		sort_order: 'a0',
		due_date: null,
		completed_at: null,
		recurrence_rule: null,
		recurrence_origin_id: null,
		created_at: new Date(),
		task_labels,
	}

	return row
}

function filter_with_search(tasks: Array<TaskItem>, query: string): Array<TaskItem> {
	return dash_task_filters.filter_display_tasks(tasks, {
		search_query: query,
		selected_label_ids: [],
		filter_mode: 'and',
	})
}

function filter_search_token_ids(
	tasks: Array<TaskItem>,
	query: string,
	filter_mode: 'one' | 'and' | 'or',
): Array<string> {
	return dash_task_filters
		.filter_display_tasks(tasks, {
			search_query: query,
			selected_label_ids: [],
			filter_mode,
		})
		.map((row) => row.id)
}

describe('dash_task_filters.filter_display_tasks / search', () => {
	const TITLE_ALPHA_ONLY = 'alpha only'
	const TITLE_GAMMA_ONLY = 'gamma only'
	const DEFAULT_TASK_ID = 't1'

	it('matches label names', () => {
		const tasks = [
			build_task_row({
				title: 'Buy milk',
				task_labels: [{ label_id: 'l1', label: { name: 'shopping' } }],
			}),
			build_task_row({
				id: 't2',
				title: 'Call mom',
				task_labels: [{ label_id: 'l2', label: { name: 'family' } }],
			}),
		]

		expect(filter_with_search(tasks, 'shop').map((row) => row.id)).toEqual([DEFAULT_TASK_ID])
	})

	it('uses AND across whitespace-separated search tokens', () => {
		const tasks = [
			build_task_row({ title: QUERY_ALPHA_BETA, id: DEFAULT_TASK_ID }),
			build_task_row({ title: TITLE_ALPHA_ONLY, id: 't2' }),
		]

		expect(filter_search_token_ids(tasks, QUERY_ALPHA_BETA, 'and')).toEqual([DEFAULT_TASK_ID])
	})

	it('uses OR across whitespace-separated search tokens', () => {
		const tasks = [
			build_task_row({ title: TITLE_ALPHA_ONLY, id: DEFAULT_TASK_ID }),
			build_task_row({ title: TITLE_GAMMA_ONLY, id: 't2' }),
		]

		expect(filter_search_token_ids(tasks, QUERY_ALPHA_BETA, 'or')).toEqual([DEFAULT_TASK_ID])
	})
})

describe('dash_task_filters.filter_display_tasks / labels', () => {
	it('uses AND when multiple labels are selected', () => {
		const tasks = [
			build_task_row({
				title: 'A',
				task_labels: [
					{ label_id: 'l1', label: { name: 'x' } },
					{ label_id: 'l2', label: { name: 'y' } },
				],
			}),
		]

		const filtered = dash_task_filters.filter_display_tasks(tasks, {
			search_query: 'A',
			selected_label_ids: ['l1', 'l2'],
			filter_mode: 'and',
		})

		expect(filtered).toHaveLength(1)
	})
})

const COMBINED_AND_TASKS = [
	build_task_row({
		id: 't1',
		title: 'alpha',
		task_labels: [{ label_id: 'l1', label: { name: 'work' } }],
	}),
	build_task_row({
		id: 't2',
		title: 'alpha',
		task_labels: [{ label_id: 'l2', label: { name: 'home' } }],
	}),
	build_task_row({
		id: 't3',
		title: 'beta',
		task_labels: [{ label_id: 'l1', label: { name: 'work' } }],
	}),
]

const COMBINED_OR_TASKS = [
	build_task_row({
		id: 't1',
		title: 'alpha',
		task_labels: [{ label_id: 'l1', label: { name: 'work' } }],
	}),
	build_task_row({
		id: 't2',
		title: 'gamma',
		task_labels: [{ label_id: 'l2', label: { name: 'home' } }],
	}),
]

describe('dash_task_filters.filter_display_tasks / combined search and labels', () => {
	it('AND mode: task must match both search text and selected labels', () => {
		const filtered = dash_task_filters.filter_display_tasks(COMBINED_AND_TASKS, {
			search_query: 'alpha',
			selected_label_ids: ['l1'],
			filter_mode: 'and',
		})

		expect(filtered.map((row) => row.id)).toEqual(['t1'])
	})

	it('OR mode: search token match and label match are each evaluated with OR, combined with AND', () => {
		// t1 matches 'alpha' (OR search pass) and has 'l1' (OR label pass) → included
		// t2 'gamma' misses 'alpha' and 'beta' (OR search fail) → excluded
		const filtered = dash_task_filters.filter_display_tasks(COMBINED_OR_TASKS, {
			search_query: QUERY_ALPHA_BETA,
			selected_label_ids: ['l1', 'l2'],
			filter_mode: 'or',
		})

		expect(filtered.map((row) => row.id)).toEqual(['t1'])
	})
})

const ONE_TASK_ID_BOTH = 'one-t1'
const ONE_TASK_ID_SINGLE = 'one-t2'
const ONE_SEARCH_BOTH = 'fox baz'
const ONE_SEARCH_SINGLE = 'fox'

describe('dash_task_filters.filter_display_tasks / one mode', () => {
	it('ONE mode: keyword search uses AND for multi-word queries', () => {
		const tasks = [
			build_task_row({ title: ONE_SEARCH_BOTH, id: ONE_TASK_ID_BOTH }),
			build_task_row({ title: ONE_SEARCH_SINGLE, id: ONE_TASK_ID_SINGLE }),
		]

		const filtered = dash_task_filters.filter_display_tasks(tasks, {
			search_query: ONE_SEARCH_BOTH,
			selected_label_ids: [],
			filter_mode: 'one',
		})

		expect(filtered.map((row) => row.id)).toEqual([ONE_TASK_ID_BOTH])
	})

	it('ONE mode: single selected label filters tasks that have that label', () => {
		const tasks = [
			build_task_row({
				id: ONE_TASK_ID_BOTH,
				title: 'A',
				task_labels: [{ label_id: 'l1', label: { name: 'work' } }],
			}),
			build_task_row({ id: ONE_TASK_ID_SINGLE, title: 'B' }),
		]

		const filtered = dash_task_filters.filter_display_tasks(tasks, {
			search_query: '',
			selected_label_ids: ['l1'],
			filter_mode: 'one',
		})

		expect(filtered.map((row) => row.id)).toEqual([ONE_TASK_ID_BOTH])
	})
})
