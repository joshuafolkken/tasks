import type { Session, User } from 'better-auth/minimal'

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
			session?: Session
			user?: User
		}

		interface PageData {
			session?: Session
			user?: User
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {}
