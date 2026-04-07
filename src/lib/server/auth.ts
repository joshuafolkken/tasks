import { getRequestEvent } from '$app/server'
// eslint-disable-next-line import/no-namespace -- Drizzle schema bundle for Better Auth adapter
import * as schema from '$lib/server/db/schema'
import { worker_environment } from '$lib/server/worker-environment'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { drizzle } from 'drizzle-orm/d1'

const { environment } = worker_environment
const database = drizzle(environment.DB, { schema })

function is_e2e_cleanup_enabled(): boolean {
	return environment.E2E_CLEANUP_ENABLED === '1' || process.env['E2E_CLEANUP_ENABLED'] === '1'
}

// Email/password auth is enabled only for development and automated test runs.
const is_e2e_env = import.meta.env.DEV || is_e2e_cleanup_enabled() || Boolean(process.env['CI'])

// eslint-disable-next-line no-restricted-syntax
export const auth = betterAuth({
	baseURL: environment.BETTER_AUTH_URL,
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
