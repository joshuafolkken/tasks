import type { Session, User } from 'better-auth/minimal'

declare namespace Cloudflare {
	interface Env {
		BETTER_AUTH_SECRET: string
		GOOGLE_CLIENT_SECRET: string
		AUTH_GITHUB_CLIENT_SECRET: string
	}
}

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
