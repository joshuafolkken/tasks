import { redirect } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import { DEMO_SUPABASE_ROUTES } from '$lib/routes'
import { url_utilities } from '$lib/url'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code')
	const next = url_utilities.safe_redirect_path(
		url.searchParams.get('next'),
		DEMO_SUPABASE_ROUTES.ACCOUNT,
	)

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code)

		if (!error) {
			redirect(HTTP_STATUS.SEE_OTHER, next)
		}
	}

	redirect(HTTP_STATUS.SEE_OTHER, i18n.localized_path(url, DEMO_SUPABASE_ROUTES.AUTH_ERROR))
}
