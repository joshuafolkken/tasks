import { auth_locals } from '$lib/auth/locals'
import { m } from '$lib/paraglide/messages'
import { redirect } from '$lib/redirect'
import { ROUTES } from '$lib/routes'
import { dash_form_parse } from '$lib/server/dash-form-parse'
import { db } from '$lib/server/db'
import { task } from '$lib/server/db/schema'
import { and, eq } from 'drizzle-orm'
import type { Actions, PageServerLoad } from './$types'
import { dash_server_actions } from './dash-server-actions'
import { dash_server_data } from './dash-server-data'

function require_authenticated_user_id(locals: App.Locals, request: Request): string {
	if (!auth_locals.is_fully_authenticated(locals)) {
		redirect.to_route(ROUTES.LOGIN, request)
	}

	const { user } = locals

	if (user !== undefined) return user.id

	return redirect.to_route(ROUTES.LOGIN, request)
}

export const load: PageServerLoad = async ({ locals, url, request }) => {
	const user_id = require_authenticated_user_id(locals, request)
	const is_completed_view = url.searchParams.get('done') === '1'
	const [tasks_with_labels, label_lists] = await Promise.all([
		dash_server_data.fetch_user_tasks_with_labels(user_id, is_completed_view),
		dash_server_data.load_dash_label_lists(user_id),
	])

	return {
		tasks: tasks_with_labels,
		labels: label_lists.labels_for_search,
		labels_top_usage: label_lists.labels_top_usage,
		is_completed_view,
	}
}

export const actions: Actions = {
	create: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_create_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const task_id = await dash_server_actions.create_task_row(user_id, parsed.value)

		return { success: true, task_id }
	},

	update_task_title: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_update_task_title_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const outcome = await dash_server_actions.apply_task_title_lines_update(
			user_id,
			parsed.value.task_id,
			parsed.value.title_lines,
		)

		if (outcome.isErr()) return { error: m.dash_error_task_not_found() }

		return {
			success: true,
			focus_task_id: outcome.value,
		}
	},

	update_task: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_update_task_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const outcome = await dash_server_actions.update_open_task_row(user_id, parsed.value)

		if (outcome === 'not_found') return { error: m.dash_error_task_not_found() }

		return { success: true }
	},

	discard_empty_open_task: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_complete_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const outcome = await dash_server_actions.delete_open_empty_task(user_id, parsed.value)

		if (outcome === 'not_found') return { error: m.dash_error_task_not_found() }
		if (outcome === 'not_empty') return { success: true, deleted: false }

		return { success: true, deleted: true }
	},

	uncomplete: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_complete_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const outcome = await dash_server_actions.restore_completed_task(user_id, parsed.value)

		if (outcome === 'not_found') return { error: m.dash_error_task_not_found() }
		if (outcome === 'not_completed') return { error: m.dash_error_uncomplete_not_completed() }

		return { success: true }
	},

	complete: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_complete_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const existing_task = await dash_server_data.find_task_with_labels_for_user(
			parsed.value,
			user_id,
		)

		if (!existing_task) return { error: m.dash_error_task_not_found() }

		await dash_server_actions.apply_task_complete(user_id, existing_task)

		return { success: true }
	},

	delete_completed: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_complete_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const outcome = await dash_server_actions.delete_completed_task(user_id, parsed.value)

		if (outcome === 'not_found') return { error: m.dash_error_task_not_found() }
		if (outcome === 'not_completed') return { error: m.dash_error_delete_not_completed() }

		return { success: true }
	},

	reorder: async ({ locals, request }) => {
		const user_id = require_authenticated_user_id(locals, request)
		const parsed = dash_form_parse.parse_reorder_body(await request.formData())
		if (parsed.isErr()) return { error: parsed.error }

		const computed = dash_server_actions.compute_reorder_sort_order(
			parsed.value.prev_sort_order,
			parsed.value.next_sort_order,
		)
		if (computed.isErr()) return { error: computed.error }

		await db
			.update(task)
			.set({ sort_order: computed.value })
			.where(and(eq(task.id, parsed.value.task_id), eq(task.user_id, user_id)))

		return { success: true }
	},
}
