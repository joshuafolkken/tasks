import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { paraglideMiddleware } from '$lib/paraglide/server'
import { handle_supabase } from '$lib/server/supabase-handle'

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale),
		})
	})

export const handle: Handle = sequence(handleParaglide, handle_supabase)
