import { json } from '@sveltejs/kit'
import { extract_titles } from '$lib/server/automation-cleanup-tasks-body'
import { db } from '$lib/server/db'
import { task } from '$lib/server/db/schema'
import { is_playwright_test_api_enabled } from '$lib/server/playwright-test-api-enabled'
import { and, eq, inArray, or, sql } from 'drizzle-orm'
import type { RequestHandler } from './$types'

/** Matches E2E leak guard (`hasText: 'E2E_'`) without SQL `LIKE` underscore wildcards. */
const E2E_TITLE_SUBSTRING = 'E2E_'

function get_user_id(locals: App.Locals): string | undefined {
	return locals.user?.id
}

async function delete_tasks_by_titles(user_id: string, titles: Array<string>): Promise<void> {
	await db.delete(task).where(and(eq(task.user_id, user_id), inArray(task.title, titles)))
}

async function delete_all_test_tasks(user_id: string): Promise<void> {
	await db
		.delete(task)
		.where(
			and(
				eq(task.user_id, user_id),
				or(eq(task.title, ''), sql`instr(${task.title}, ${E2E_TITLE_SUBSTRING}) > 0`),
			),
		)
}

async function parse_body_titles(request: Request): Promise<Array<string> | undefined> {
	try {
		const parsed = extract_titles(await request.json())

		return parsed.ok ? parsed.titles : undefined
	} catch {
		return undefined
	}
}

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!is_playwright_test_api_enabled()) return json({ error: 'not enabled' }, { status: 403 })

	const user_id = get_user_id(locals)
	if (user_id === undefined) return json({ error: 'unauthorized' }, { status: 401 })

	const titles = await parse_body_titles(request)

	await (titles === undefined
		? delete_all_test_tasks(user_id)
		: delete_tasks_by_titles(user_id, titles))

	return json({ ok: true })
}
