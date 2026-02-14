import { getRequestEvent } from '$app/server'
import { betterAuth } from 'better-auth'
import { sveltekitCookies } from 'better-auth/svelte-kit'

// eslint-disable-next-line no-restricted-syntax
export const auth = betterAuth({
	secret: process.env['BETTER_AUTH_SECRET'],
	// eslint-disable-next-line @typescript-eslint/naming-convention
	baseURL: process.env['BETTER_AUTH_URL'],
	plugins: [sveltekitCookies(getRequestEvent)],
})
