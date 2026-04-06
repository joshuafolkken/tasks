/* eslint-disable unicorn/no-null -- mirrors Drizzle nullable columns */
import { describe, expect, it } from 'vitest'
import { dash_label_lists } from './dash-label-lists'

const USER_ID = 'u1'
const RECENCY_LOW = 1000
const RECENCY_MID = 2000
const RECENCY_HIGH = 3000

function make_label(id: string, name: string): { id: string; user_id: string; name: string } {
	return { id, user_id: USER_ID, name }
}

function make_stats(
	label_id: string,
	usage_count: number,
	last_used_ms: number,
): { label_id: string; usage_count: number; last_used_at: Date | null } {
	return {
		label_id,
		usage_count,
		last_used_at: last_used_ms > 0 ? new Date(last_used_ms) : null,
	}
}

describe('dash_label_lists.build_label_lists_from_stats / labels_for_search (recency order)', () => {
	it('sorts labels with most recently used first', () => {
		const labels = [make_label('l1', 'work'), make_label('l2', 'home'), make_label('l3', 'errand')]
		const stats = [
			make_stats('l1', 1, RECENCY_LOW),
			make_stats('l2', 2, RECENCY_HIGH),
			make_stats('l3', 1, RECENCY_MID),
		]

		const { labels_for_search } = dash_label_lists.build_label_lists_from_stats(labels, stats)

		expect(labels_for_search.map((row) => row.id)).toEqual(['l2', 'l3', 'l1'])
	})

	it('breaks recency tie alphabetically', () => {
		const labels = [make_label('l1', 'beta'), make_label('l2', 'alpha')]
		const stats = [make_stats('l1', 1, RECENCY_LOW), make_stats('l2', 1, RECENCY_LOW)]

		const { labels_for_search } = dash_label_lists.build_label_lists_from_stats(labels, stats)

		expect(labels_for_search.map((row) => row.name)).toEqual(['alpha', 'beta'])
	})

	it('places never-used labels last', () => {
		const labels = [make_label('l1', 'used'), make_label('l2', 'unused')]
		const stats = [make_stats('l1', 2, RECENCY_HIGH)]

		const { labels_for_search } = dash_label_lists.build_label_lists_from_stats(labels, stats)

		expect(labels_for_search[0]?.id).toBe('l1')
		expect(labels_for_search[1]?.id).toBe('l2')
	})
})

describe('dash_label_lists.build_label_lists_from_stats / labels_top_usage (usage order, capped at 10)', () => {
	it('sorts labels by usage count descending', () => {
		const labels = [make_label('l1', 'a'), make_label('l2', 'b'), make_label('l3', 'c')]
		const stats = [
			make_stats('l1', 5, RECENCY_LOW),
			make_stats('l2', 10, RECENCY_LOW),
			make_stats('l3', 3, RECENCY_LOW),
		]

		const { labels_top_usage } = dash_label_lists.build_label_lists_from_stats(labels, stats)

		expect(labels_top_usage.map((row) => row.id)).toEqual(['l2', 'l1', 'l3'])
	})

	it('limits results to 10 labels', () => {
		const LABEL_COUNT = 15
		const labels = Array.from({ length: LABEL_COUNT }, (_, index) =>
			make_label(`l${String(index)}`, `label${String(index)}`),
		)
		const stats = labels.map((row, index) => make_stats(row.id, index + 1, RECENCY_LOW))

		const { labels_top_usage } = dash_label_lists.build_label_lists_from_stats(labels, stats)

		expect(labels_top_usage).toHaveLength(10)
	})

	it('breaks usage tie alphabetically', () => {
		const labels = [make_label('l1', 'beta'), make_label('l2', 'alpha')]
		const stats = [make_stats('l1', 3, RECENCY_LOW), make_stats('l2', 3, RECENCY_LOW)]

		const { labels_top_usage } = dash_label_lists.build_label_lists_from_stats(labels, stats)

		expect(labels_top_usage.map((row) => row.name)).toEqual(['alpha', 'beta'])
	})
})
