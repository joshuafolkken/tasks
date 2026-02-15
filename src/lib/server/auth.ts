import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { fail, redirect, type ActionFailure } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'

/* eslint-disable @typescript-eslint/naming-convention -- ROUTES オブジェクトのプロパティ名に合わせる */
interface SignInRoutes {
	readonly AUTH_CALLBACK: string
	readonly ACCOUNT: string
}

interface SignInOptions {
	next_path?: string
	routes: SignInRoutes
}

const sign_in = async (
	supabase: SupabaseClient,
	url: URL,
	provider_id: 'google' | 'github',
	options: SignInOptions,
): Promise<ActionFailure<{ message: string }>> => {
	const { next_path, routes } = options
	const callback_url = new URL(routes.AUTH_CALLBACK, url.origin)

	callback_url.searchParams.set('next', next_path ?? i18n.localized_path(url, routes.ACCOUNT))

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

function require_session(
	home_path: string,
): (url: URL, safe_get_session: () => Promise<{ session: Session | null }>) => Promise<Session> {
	return async (url: URL, safe_get_session: () => Promise<{ session: Session | null }>) => {
		const { session } = await safe_get_session()

		if (!session) {
			// eslint-disable-next-line @typescript-eslint/only-throw-error
			throw redirect(HTTP_STATUS.SEE_OTHER, i18n.localized_path(url, home_path))
		}

		return session
	}
}

export const auth = {
	sign_in,
	require_session,
}
