import { relations, sql } from 'drizzle-orm'
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { user } from './auth.schema'

export const task = sqliteTable(
	'task',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		user_id: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		detail: text('detail'),
		sort_order: text('sort_order').notNull().default('a0'),
		due_date: text('due_date'),
		completed_at: integer('completed_at', { mode: 'timestamp_ms' }),
		recurrence_rule: text('recurrence_rule'),
		recurrence_origin_id: text('recurrence_origin_id'),
		created_at: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index('task_user_id_idx').on(table.user_id)],
)

export const label = sqliteTable(
	'label',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		user_id: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
	},
	(table) => [uniqueIndex('label_user_id_name_idx').on(table.user_id, table.name)],
)

export const task_label = sqliteTable(
	'task_label',
	{
		task_id: text('task_id')
			.notNull()
			.references(() => task.id, { onDelete: 'cascade' }),
		label_id: text('label_id')
			.notNull()
			.references(() => label.id, { onDelete: 'cascade' }),
	},
	(table) => [primaryKey({ columns: [table.task_id, table.label_id] })],
)

export const task_relations = relations(task, ({ many }) => ({
	task_labels: many(task_label),
}))

export const label_relations = relations(label, ({ many }) => ({
	task_labels: many(task_label),
}))

export const task_label_relations = relations(task_label, ({ one }) => ({
	task: one(task, { fields: [task_label.task_id], references: [task.id] }),
	label: one(label, { fields: [task_label.label_id], references: [label.id] }),
}))

export * from './auth.schema'
