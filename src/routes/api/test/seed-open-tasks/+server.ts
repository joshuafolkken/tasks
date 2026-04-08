import { json } from '@sveltejs/kit'
import { parse_seed_open_tasks_json } from '$lib/server/automation-seed-open-tasks-body'
import { is_playwright_test_api_enabled } from '$lib/server/playwright-test-api-enabled'
/* eslint-disable-next-line @typescript-eslint/no-restricted-imports -- dash actions are co-located with the page route */
import { dash_server_actions } from '../../../dash/dash-server-actions'
import type { RequestHandler } from './$types'

function get_user_id(locals: App.Locals): string | undefined {
	return locals.user?.id
}

async function read_json_body(
	request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
	try {
		const body: unknown = await request.json()

		return { ok: true, body }
	} catch {
		return { ok: false }
	}
}

async function post_seed_handler(locals: App.Locals, request: Request): Promise<Response> {
	if (!is_playwright_test_api_enabled()) return json({ error: 'not enabled' }, { status: 403 })

	const user_id = get_user_id(locals)
	if (user_id === undefined) return json({ error: 'unauthorized' }, { status: 401 })

	const raw = await read_json_body(request)
	if (!raw.ok) return json({ error: 'invalid json' }, { status: 400 })

	const parsed = parse_seed_open_tasks_json(raw.body)
	if (!parsed.ok) return json({ error: parsed.error }, { status: 400 })

	await dash_server_actions.seed_open_tasks_at_top(user_id, parsed.titles)

	return json({ ok: true })
}

export const POST: RequestHandler = async ({ locals, request }) =>
	await post_seed_handler(locals, request)
