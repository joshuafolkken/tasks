import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { building } from '$app/environment'
import { get_auth } from '$lib/auth'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { svelteKitHandler } from 'better-auth/svelte-kit'

const handle_paraglide: Handle = async ({ event, resolve }) =>
	await paraglideMiddleware(event.request, async ({ request, locale }) => {
		event.request = request

		return await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
		})
	})

const handle_better_auth: Handle = async ({ event, resolve }) => {
	const platform = event.platform as { env: Env }
	const auth = get_auth(platform.env)
	const { headers } = event.request
	const session = await auth.api.getSession({ headers })

	if (session) {
		// eslint-disable-next-line require-atomic-updates
		event.locals.session = session.session
		// eslint-disable-next-line require-atomic-updates
		event.locals.user = session.user
	}

	return await svelteKitHandler({ event, resolve, auth, building })
}

// eslint-disable-next-line no-restricted-syntax
export const handle: Handle = sequence(handle_better_auth, handle_paraglide)
