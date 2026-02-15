import type { SupabaseClient, Session as SupabaseSession } from '@supabase/supabase-js'
import type { Session as BetterAuthSession, User as BetterAuthUser } from 'better-auth'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env
			ctx: ExecutionContext
			caches: CacheStorage
			cf?: IncomingRequestCfProperties
		}

		interface Locals {
			supabase: SupabaseClient
			safe_get_session: () => Promise<{
				session: SupabaseSession | null
				user?: SupabaseSession['user'] | null
			}>
			session?: BetterAuthSession
			user?: BetterAuthUser
		}

		interface PageData {
			session: SupabaseSession | null
			user?: SupabaseSession['user'] | null
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
