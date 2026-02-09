import { fail, redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, safe_get_session } }) => {
	const { session } = await safe_get_session()

	if (!session) {
		redirect(HTTP_STATUS.SEE_OTHER, '/')
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('username, full_name, website, avatar_url')
		.eq('id', session.user.id)
		.single()

	return { session, profile }
}

export const actions: Actions = {
	// eslint-disable-next-line max-statements
	update: async ({ request, locals: { supabase, safe_get_session } }) => {
		const form_data = await request.formData()
		const full_name = form_data.get('full_name') as string
		const username = form_data.get('username') as string
		const website = form_data.get('website') as string
		const avatar_url = form_data.get('avatar_url') as string

		const { session } = await safe_get_session()

		if (!session) {
			redirect(HTTP_STATUS.SEE_OTHER, '/')
		}

		const { error } = await supabase.from('profiles').upsert({
			id: session.user.id,
			full_name,
			username,
			website,
			avatar_url,
			updated_at: new Date(),
		})

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR, { full_name, username, website, avatar_url })
		}

		return { full_name, username, website, avatar_url }
	},
	signout: async ({ locals: { supabase, safe_get_session } }) => {
		const { session } = await safe_get_session()

		if (!session) {
			return redirect(HTTP_STATUS.SEE_OTHER, '/')
		}

		const { error } = await supabase.auth.signOut()

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR)
		}

		return redirect(HTTP_STATUS.SEE_OTHER, '/')
	},
}
