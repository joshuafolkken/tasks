import type { SupabaseClient } from '@supabase/supabase-js'
import { fail, redirect, type ActionFailure, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import { ROUTES } from '$lib/routes'
import type { PageServerLoad } from './$types'

const sign_in = async (
	supabase: SupabaseClient,
	url: URL,
	provider_id: 'google' | 'github',
	next_path?: string,
): Promise<ActionFailure<{ message: string }>> => {
	const callback_url = new URL(ROUTES.AUTH_CALLBACK, url.origin)
	callback_url.searchParams.set('next', next_path ?? i18n.localized_path(url, ROUTES.ACCOUNT))

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: provider_id,
		options: {
			redirectTo: callback_url.href,
		},
	})

	if (error) {
		return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR, { message: error.message })
	}

	return redirect(HTTP_STATUS.SEE_OTHER, data.url)
}

const load: PageServerLoad = async ({ url, locals: { safe_get_session } }) => {
	const { session } = await safe_get_session()

	if (session) {
		redirect(HTTP_STATUS.SEE_OTHER, i18n.localized_path(url, ROUTES.ACCOUNT))
	}

	return { url: url.toString() }
}

const actions: Actions = {
	signInWithGoogle: async ({ locals: { supabase }, url }) => await sign_in(supabase, url, 'google'),
	signInWithGitHub: async ({ locals: { supabase }, url }) => await sign_in(supabase, url, 'github'),
}

export { load, actions }
