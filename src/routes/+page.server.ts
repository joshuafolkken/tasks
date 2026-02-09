import { fail, redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { safe_get_session } }) => {
	const { session } = await safe_get_session()

	if (session !== null) {
		redirect(HTTP_STATUS.SEE_OTHER, '/account')
	}

	return { url: url.toString() }
}

export const actions: Actions = {
	signInWithGoogle: async ({ locals: { supabase }, url }) => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${url.origin}/auth/callback`,
			},
		})

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR, { message: error.message })
		}

		return redirect(HTTP_STATUS.SEE_OTHER, data.url)
	},
}
