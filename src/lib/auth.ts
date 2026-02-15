// src/lib/auth.ts
import { getRequestEvent } from '$app/server'
import { get_db } from '$lib/server/db'
// eslint-disable-next-line import/no-namespace
import * as schema from '$lib/server/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sveltekitCookies } from 'better-auth/svelte-kit'

// eslint-disable-next-line init-declarations
let _auth: ReturnType<typeof betterAuth> | undefined

function create_auth(platform_environment: Env): ReturnType<typeof betterAuth> {
	const database = get_db(platform_environment.tasks_db)

	return betterAuth({
		database: drizzleAdapter(database, {
			provider: 'sqlite',
			schema,
		}),
		// eslint-disable-next-line @typescript-eslint/dot-notation
		secret: platform_environment['BETTER_AUTH_SECRET'],
		baseURL: platform_environment.BETTER_AUTH_URL,
		socialProviders: {
			google: {
				clientId: platform_environment.GOOGLE_CLIENT_ID,
				// eslint-disable-next-line @typescript-eslint/dot-notation
				clientSecret: platform_environment['GOOGLE_CLIENT_SECRET'],
			},
			github: {
				clientId: platform_environment.AUTH_GITHUB_CLIENT_ID,
				// eslint-disable-next-line @typescript-eslint/dot-notation
				clientSecret: platform_environment['AUTH_GITHUB_CLIENT_SECRET'],
			},
		},
		plugins: [sveltekitCookies(getRequestEvent)],
	})
}

// eslint-disable-next-line no-restricted-syntax
export function get_auth(platform_environment: Env): ReturnType<typeof betterAuth> {
	_auth ??= create_auth(platform_environment)

	return _auth
}
