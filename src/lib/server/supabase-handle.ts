import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Handle, RequestEvent } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'

const init_supabase_client = (event: RequestEvent): void => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies_to_set) => {
				for (const { name, value, options } of cookies_to_set) {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
					event.cookies.set(name, value, { ...options, path: '/' })
				}
			},
		},
	}) as SupabaseClient
}

const init_safe_get_session = (event: RequestEvent): void => {
	event.locals.safe_get_session = async () => {
		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser()

		if (error) {
			// eslint-disable-next-line
			return { session: null, user: null }
		}

		const {
			data: { session },
		} = await event.locals.supabase.auth.getSession()

		return { session, user }
	}
}

export const handle_supabase: Handle = async ({ event, resolve }) => {
	init_supabase_client(event)
	init_safe_get_session(event)

	return await resolve(event, {
		filterSerializedResponseHeaders(name: string) {
			return name === 'content-range' || name === 'x-supabase-api-version'
		},
	})
}
