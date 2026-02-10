import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { fail, redirect, type ActionFailure } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import { ROUTES } from '$lib/routes'

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

	// eslint-disable-next-line @typescript-eslint/only-throw-error
	throw redirect(HTTP_STATUS.SEE_OTHER, data.url)
}

const require_session = async (
	url: URL,
	safe_get_session: () => Promise<{ session: Session | null }>,
): Promise<Session> => {
	const { session } = await safe_get_session()

	if (!session) {
		// eslint-disable-next-line @typescript-eslint/only-throw-error
		throw redirect(HTTP_STATUS.SEE_OTHER, i18n.home_path(url))
	}

	return session
}

export const auth = {
	sign_in,
	require_session,
}
