/* eslint-disable unicorn/no-null -- minimal TaskItem-shaped rows for reorder math */
import type { TaskItem } from '$lib/dash-page-types'
import { describe, expect, it } from 'vitest'
import { dash_reorder_client } from './index'

function mock_task(id: string, sort: string): TaskItem {
	return {
		id,
		sort_order: sort,
		title: id,
		detail: null,
		due_date: null,
		recurrence_rule: null,
		recurrence_origin_id: null,
		completed_at: null,
		task_labels: [],
	} as unknown as TaskItem
}

describe('dash_reorder_client.reorder_with_insert_before', () => {
	it('moves an item before the target', () => {
		const list = [mock_task('a', 'a'), mock_task('b', 'b'), mock_task('c', 'c')]
		const next = dash_reorder_client.reorder_with_insert_before(list, 'c', 'a')

		expect(next.map((row) => row.id)).toEqual(['c', 'a', 'b'])
	})

	it('returns a copy unchanged when ids are invalid', () => {
		const list = [mock_task('a', 'a')]
		const next = dash_reorder_client.reorder_with_insert_before(list, 'x', 'a')

		expect(next.map((row) => row.id)).toEqual(['a'])
	})
})

describe('dash_reorder_client.move_task_to_end', () => {
	it('appends the dragged item', () => {
		const list = [mock_task('a', 'a'), mock_task('b', 'b'), mock_task('c', 'c')]
		const next = dash_reorder_client.move_task_to_end(list, 'a')

		expect(next.map((row) => row.id)).toEqual(['b', 'c', 'a'])
	})
})

describe('dash_reorder_client.pick_insert_before_at_drop (upper vs lower)', () => {
	const ids = ['a', 'b', 'c']

	it('upper half inserts before the hovered row', () => {
		expect(
			dash_reorder_client.pick_insert_before_at_drop({
				ordered_task_ids: ids,
				target_task_id: 'b',
				pointer_client_y: 40,
				row_client_top: 40,
				row_client_height: 40,
			}),
		).toBe('b')
	})

	it('lower half inserts before the following row', () => {
		expect(
			dash_reorder_client.pick_insert_before_at_drop({
				ordered_task_ids: ids,
				target_task_id: 'b',
				pointer_client_y: 70,
				row_client_top: 40,
				row_client_height: 40,
			}),
		).toBe('c')
	})
})

describe('dash_reorder_client.pick_insert_before_at_drop (list end)', () => {
	it('lower half on last row appends to end', () => {
		expect(
			dash_reorder_client.pick_insert_before_at_drop({
				ordered_task_ids: ['a', 'b', 'c'],
				target_task_id: 'c',
				pointer_client_y: 999,
				row_client_top: 100,
				row_client_height: 40,
			}),
		).toBeUndefined()
	})
})
