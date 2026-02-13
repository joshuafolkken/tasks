import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	age: integer('age'),
})

/** Supabase Auth の user.id を user_id に保存して紐づける */
export const todo = sqliteTable('todo', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id').notNull(),
	title: text('title').notNull(),
	description: text('description'),
	created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.$defaultFn(() => new Date())
		.$onUpdate(() => new Date()),
})
