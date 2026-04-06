import { json } from '@sveltejs/kit'
import { db } from '$lib/server/db'
import { task } from '$lib/server/db/schema'
import { is_playwright_test_api_enabled } from '$lib/server/playwright-test-api-enabled'
import { and, eq, or, sql } from 'drizzle-orm'
import type { RequestHandler } from './$types'

/** Matches E2E leak guard (`hasText: 'E2E_'`) without SQL `LIKE` underscore wildcards. */
const E2E_TITLE_SUBSTRING = 'E2E_'

function get_user_id(locals: App.Locals): string | undefined {
	return locals.user?.id
}

async function delete_test_tasks(user_id: string): Promise<void> {
	await db
		.delete(task)
		.where(
			and(
				eq(task.user_id, user_id),
				or(eq(task.title, ''), sql`instr(${task.title}, ${E2E_TITLE_SUBSTRING}) > 0`),
			),
		)
}

export const POST: RequestHandler = async ({ locals }) => {
	if (!is_playwright_test_api_enabled()) return json({ error: 'not enabled' }, { status: 403 })

	const user_id = get_user_id(locals)
	if (user_id === undefined) return json({ error: 'unauthorized' }, { status: 401 })

	await delete_test_tasks(user_id)

	return json({ ok: true })
}
