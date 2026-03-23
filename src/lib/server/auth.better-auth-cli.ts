/**
 * `better-auth generate`（`pnpm auth:schema`）専用。
 * Jiti は `$app/*` を解決できないため、`auth.ts` とは分ける。
 */
import { createClient } from '@libsql/client'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/libsql'
// eslint-disable-next-line import/no-namespace -- Drizzle schema bundle for Better Auth adapter
import * as schema from './db/schema'

const cli_oauth_placeholder = 'cli-placeholder'

const client = createClient({ url: ':memory:' })
const database = drizzle(client, { schema })

// eslint-disable-next-line no-restricted-syntax
export const auth = betterAuth({
	baseURL: 'http://localhost:5173',
	secret: '0123456789abcdef0123456789abcdef',
	database: drizzleAdapter(database, { provider: 'sqlite', schema }),
	socialProviders: {
		google: {
			clientId: cli_oauth_placeholder,
			clientSecret: cli_oauth_placeholder,
		},
		github: {
			clientId: cli_oauth_placeholder,
			clientSecret: cli_oauth_placeholder,
		},
	},
})
