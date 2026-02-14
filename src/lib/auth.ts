// src/lib/auth.ts
import { getRequestEvent } from '$app/server'
import { get_db } from '$lib/server/db'
// eslint-disable-next-line import/no-namespace
import * as schema from '$lib/server/db/schema'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { env } from 'cloudflare:workers'

const database = get_db(env.tasks_db)

// eslint-disable-next-line no-restricted-syntax
export const auth = betterAuth({
	database: drizzleAdapter(database, {
		provider: 'sqlite',
		schema,
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	plugins: [sveltekitCookies(getRequestEvent)],
})
