import { fail, redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import { DEMO_SUPABASE_ROUTES } from '$lib/routes'
import { auth } from '$lib/server/auth'
import { profile_service } from '$lib/server/services/profile'
import { form_utilities } from '$lib/server/utils/form'
import type { PageServerLoad } from './$types'

async function get_profile_form_data(
	request: Request,
): Promise<{ full_name: string; username: string; website: string }> {
	const form_data = await request.formData()

	return {
		full_name: form_utilities.get_string(form_data.get('full_name')),
		username: form_utilities.get_string(form_data.get('username')),
		website: form_utilities.get_string(form_data.get('website')),
	}
}

const require_session_demo = auth.require_session(DEMO_SUPABASE_ROUTES.HOME)

const load: PageServerLoad = async ({ url, locals: { supabase, safe_get_session } }) => {
	const session = await require_session_demo(url, safe_get_session)
	const profile = await profile_service.get_profile(supabase, session.user.id)

	return { session, profile }
}

const actions: Actions = {
	update: async ({ request, url, locals: { supabase, safe_get_session } }) => {
		const { full_name, username, website } = await get_profile_form_data(request)
		const session = await require_session_demo(url, safe_get_session)

		const { error } = await profile_service.update_profile(supabase, session.user.id, {
			full_name,
			username,
			website,
		})

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR, { full_name, username, website })
		}

		return { full_name, username, website }
	},
	signout: async ({ url, locals: { supabase, safe_get_session } }) => {
		await require_session_demo(url, safe_get_session)

		const { error } = await supabase.auth.signOut()

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR)
		}

		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw redirect(HTTP_STATUS.SEE_OTHER, i18n.localized_path(url, DEMO_SUPABASE_ROUTES.HOME))
	},
}

export { load, actions }
