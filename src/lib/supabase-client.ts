import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'

// eslint-disable-next-line @typescript-eslint/no-deprecated -- type extraction only
type SupabaseClientType = ReturnType<typeof createBrowserClient>

interface CookieEntry {
	name: string
	value: string
}

function create(fetch: typeof globalThis.fetch, cookies: Array<CookieEntry>): SupabaseClientType {
	if (isBrowser()) {
		return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
			global: { fetch },
		})
	}

	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		global: { fetch },
		cookies: {
			getAll() {
				return cookies
			},
		},
	})
}

const supabase_client = {
	create,
}

export { supabase_client }
