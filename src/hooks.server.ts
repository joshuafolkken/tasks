import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { building } from '$app/environment'
import { get_auth } from '$lib/auth'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { handle_supabase } from '$lib/server/supabase-handle'
import { svelteKitHandler } from 'better-auth/svelte-kit'

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
		})
	})

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const platform = event.platform as { env: Env }
	const auth = get_auth(platform.env)
	const session = await auth.api.getSession({ headers: event.request.headers })
	if (session) {
		event.locals.session = session.session
		event.locals.user = session.user
	}

	return svelteKitHandler({ event, resolve, auth, building })
}

export const handle: Handle = sequence(handleParaglide, handle_supabase, handleBetterAuth)
