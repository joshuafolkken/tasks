import type { Handle, RequestEvent } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { building } from '$app/environment'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { auth } from '$lib/server/auth'
import { svelteKitHandler } from 'better-auth/svelte-kit'

type AuthSessionPayload = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

function assign_session_to_locals(
	event: RequestEvent,
	session_payload: AuthSessionPayload | null,
): void {
	if (!session_payload) return

	event.locals = {
		...event.locals,
		session: session_payload.session,
		user: session_payload.user,
	}
}

const handle_paraglide: Handle = async ({ event, resolve }) =>
	await paraglideMiddleware(event.request, async ({ request, locale }) => {
		event.request = request

		return await resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
		})
	})

const handle_better_auth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers })

	assign_session_to_locals(event, session)

	return await svelteKitHandler({ event, resolve, auth, building })
}

// eslint-disable-next-line no-restricted-syntax
export const handle: Handle = sequence(handle_better_auth, handle_paraglide)
