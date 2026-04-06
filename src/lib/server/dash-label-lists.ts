import { db } from '$lib/server/db'
import { task, task_label } from '$lib/server/db/schema'
import { count, eq, max } from 'drizzle-orm'

const TOP_USAGE_LABEL_LIMIT = 10

interface LabelRow {
	id: string
	user_id: string
	name: string
}

/* eslint-disable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types -- Drizzle infers aggregated select row shape */
function fetch_label_stats(user_id: string) {
	return db
		.select({
			label_id: task_label.label_id,
			usage_count: count(),
			last_used_at: max(task.created_at),
		})
		.from(task_label)
		.innerJoin(task, eq(task.id, task_label.task_id))
		.where(eq(task.user_id, user_id))
		.groupBy(task_label.label_id)
}

/* eslint-enable @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types */

type LabelStatsRows = Awaited<ReturnType<typeof fetch_label_stats>>

function label_recency_ms(
	label_row: LabelRow,
	stats_map: Map<string, { usage_count: number; last_used_at: number }>,
): number {
	return stats_map.get(label_row.id)?.last_used_at ?? 0
}

function last_used_time_ms(value: Date | null): number {
	if (value === null) return 0

	return value.getTime()
}

function normalize_usage_count(value: number | bigint): number {
	return typeof value === 'bigint' ? Number(value) : value
}

function build_stats_map(
	stats: LabelStatsRows,
): Map<string, { usage_count: number; last_used_at: number }> {
	return new Map(
		stats.map((row) => [
			row.label_id,
			{
				usage_count: normalize_usage_count(row.usage_count),
				last_used_at: last_used_time_ms(row.last_used_at),
			},
		]),
	)
}

function compare_labels_by_recency(
	left: LabelRow,
	right: LabelRow,
	stats_map: Map<string, { usage_count: number; last_used_at: number }>,
): number {
	const left_ms = label_recency_ms(left, stats_map)
	const right_ms = label_recency_ms(right, stats_map)

	if (right_ms !== left_ms) {
		return right_ms - left_ms
	}

	return left.name.localeCompare(right.name)
}

function sort_labels_by_recency(
	label_rows: Array<LabelRow>,
	stats_map: Map<string, { usage_count: number; last_used_at: number }>,
): Array<LabelRow> {
	return label_rows.toSorted((left, right) => compare_labels_by_recency(left, right, stats_map))
}

function compare_usage_entries(
	left: { label_row: LabelRow; usage_count: number },
	right: { label_row: LabelRow; usage_count: number },
): number {
	if (right.usage_count !== left.usage_count) return right.usage_count - left.usage_count

	return left.label_row.name.localeCompare(right.label_row.name)
}

function pick_top_usage_labels(
	label_rows: Array<LabelRow>,
	stats_map: Map<string, { usage_count: number; last_used_at: number }>,
): Array<LabelRow> {
	const scored = label_rows.map((label_row) => ({
		label_row,
		usage_count: stats_map.get(label_row.id)?.usage_count ?? 0,
	}))

	return scored
		.toSorted(compare_usage_entries)
		.slice(0, TOP_USAGE_LABEL_LIMIT)
		.map((item) => item.label_row)
}

function build_label_lists_from_stats(
	label_rows: Array<LabelRow>,
	stats: LabelStatsRows,
): { labels_for_search: Array<LabelRow>; labels_top_usage: Array<LabelRow> } {
	const stats_map = build_stats_map(stats)

	return {
		labels_for_search: sort_labels_by_recency(label_rows, stats_map),
		labels_top_usage: pick_top_usage_labels(label_rows, stats_map),
	}
}

async function load_dash_label_lists(
	user_id: string,
	fetch_labels: (uid: string) => Promise<Array<LabelRow>>,
): Promise<{ labels_for_search: Array<LabelRow>; labels_top_usage: Array<LabelRow> }> {
	const [label_rows, stats] = await Promise.all([fetch_labels(user_id), fetch_label_stats(user_id)])

	return build_label_lists_from_stats(label_rows, stats)
}

const dash_label_lists = {
	fetch_label_stats,
	load_dash_label_lists,
	build_label_lists_from_stats,
}

export { dash_label_lists }
export type { LabelRow }
