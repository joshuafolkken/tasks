import { Session, SupabaseClient } from '@supabase/supabase-js'

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
			safe_get_session: () => Promise<{ session: Session | null; user?: Session['user'] | null }>
		}

		interface PageData {
			session: Session | null
			user?: Session['user'] | null
		}

		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {}
