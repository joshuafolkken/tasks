import { getRequestEvent } from '$app/server'
import { auth_base_url_module } from '$lib/server/auth-base-url'
// eslint-disable-next-line import/no-namespace -- Drizzle schema bundle for Better Auth adapter
import * as schema from '$lib/server/db/schema'
import { worker_environment } from '$lib/server/worker-environment'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { drizzle } from 'drizzle-orm/d1'

const { environment } = worker_environment
const database = drizzle(environment.DB, { schema })

// Email/password auth is enabled for dev (Vite), CI builds, and runtime env flag.
// import.meta.env.E2E_CLEANUP_ENABLED is injected at build time by vite.config.ts when
// E2E_CLEANUP_ENABLED=1 is set in the build environment (e.g. CI E2E job).
// The runtime fallback handles local wrangler dev when the var reaches the Worker binding.
function is_e2e_runtime(): boolean {
	return environment.E2E_CLEANUP_ENABLED === '1'
}

const is_e2e_env = import.meta.env.DEV || import.meta.env.E2E_CLEANUP_ENABLED || is_e2e_runtime()

const auth_base_url = auth_base_url_module.resolve_auth_base_url({
	better_auth_url: environment.BETTER_AUTH_URL,
	is_vite_dev: import.meta.env.DEV,
	is_e2e_cleanup: import.meta.env.E2E_CLEANUP_ENABLED || is_e2e_runtime(),
})

// eslint-disable-next-line no-restricted-syntax
export const auth = betterAuth({
	baseURL: auth_base_url,
	secret: environment.BETTER_AUTH_SECRET,
	database: drizzleAdapter(database, { provider: 'sqlite', schema }),
	emailAndPassword: {
		enabled: is_e2e_env,
		requireEmailVerification: false,
	},
	socialProviders: {
		google: {
			clientId: environment.GOOGLE_CLIENT_ID,
			clientSecret: environment.GOOGLE_CLIENT_SECRET,
		},
		github: {
			clientId: environment.AUTH_GITHUB_CLIENT_ID,
			clientSecret: environment.AUTH_GITHUB_CLIENT_SECRET,
		},
	},
	plugins: [sveltekitCookies(getRequestEvent)],
})
