import { redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import { ROUTES } from '$lib/routes'
import { auth } from '$lib/server/auth'
import type { PageServerLoad } from './$types'

const load: PageServerLoad = async ({ url, locals: { safe_get_session } }) => {
	const { session } = await safe_get_session()

	if (session) {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw redirect(HTTP_STATUS.SEE_OTHER, i18n.localized_path(url, ROUTES.ACCOUNT))
	}

	return { url: url.toString() }
}

const actions: Actions = {
	signInWithGoogle: async ({ locals: { supabase }, url }) =>
		await auth.sign_in(supabase, url, 'google'),
	signInWithGitHub: async ({ locals: { supabase }, url }) =>
		await auth.sign_in(supabase, url, 'github'),
}

export { load, actions }
