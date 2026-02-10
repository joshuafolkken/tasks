import { fail, redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import { auth } from '$lib/server/auth'
import { profile_service } from '$lib/server/services/profile'
import { form_utilities } from '$lib/server/utils/form'
import type { PageServerLoad } from './$types'

async function get_profile_form_data(
	request: Request,
): Promise<{ full_name: string; username: string; website: string; avatar_url: string }> {
	const form_data = await request.formData()
	return {
		full_name: form_utilities.get_string(form_data.get('full_name')),
		username: form_utilities.get_string(form_data.get('username')),
		website: form_utilities.get_string(form_data.get('website')),
		avatar_url: form_utilities.get_string(form_data.get('avatar_url')),
	}
}

const load: PageServerLoad = async ({ url, locals: { supabase, safe_get_session } }) => {
	const session = await auth.require_session(url, safe_get_session)
	const profile = await profile_service.get_profile(supabase, session.user.id)

	return { session, profile }
}

const actions: Actions = {
	update: async ({ request, url, locals: { supabase, safe_get_session } }) => {
		const { full_name, username, website, avatar_url } = await get_profile_form_data(request)
		const session = await auth.require_session(url, safe_get_session)

		const { error } = await profile_service.update_profile(supabase, session.user.id, {
			full_name,
			username,
			website,
			avatar_url,
		})

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR, { full_name, username, website, avatar_url })
		}

		return { full_name, username, website, avatar_url }
	},
	signout: async ({ url, locals: { supabase, safe_get_session } }) => {
		await auth.require_session(url, safe_get_session)

		const { error } = await supabase.auth.signOut()

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR)
		}

		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw redirect(HTTP_STATUS.SEE_OTHER, i18n.home_path(url))
	},
}

export { load, actions }
