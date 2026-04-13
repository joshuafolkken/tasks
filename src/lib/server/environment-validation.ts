import { z } from 'zod'

/**
 * Zod schema for Cloudflare Worker string environment variables.
 * Validates that required secrets are present and non-empty at startup.
 * D1Database / Fetcher bindings are validated by type system, not Zod.
 */
const worker_environment_schema = z.object({
	BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
	BETTER_AUTH_URL: z.url('BETTER_AUTH_URL must be a valid URL'),
	GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
	GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
	AUTH_GITHUB_CLIENT_ID: z.string().min(1, 'AUTH_GITHUB_CLIENT_ID is required'),
	AUTH_GITHUB_CLIENT_SECRET: z.string().min(1, 'AUTH_GITHUB_CLIENT_SECRET is required'),
	TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
	TELEGRAM_CHAT_ID: z.string().min(1, 'TELEGRAM_CHAT_ID is required'),
})

type WorkerEnvironmentStrings = z.infer<typeof worker_environment_schema>

function validate_worker_environment(environment: object): WorkerEnvironmentStrings {
	return worker_environment_schema.parse(environment)
}

function is_valid_worker_environment(environment: object): boolean {
	return worker_environment_schema.safeParse(environment).success
}

/** Log missing env vars as warnings without crashing the server. */
function warn_if_invalid(environment: object): void {
	const result = worker_environment_schema.safeParse(environment)
	if (result.success) return

	for (const issue of result.error.issues) {
		// eslint-disable-next-line no-console -- intentional startup diagnostic
		console.warn(`[env] ${issue.message} (path: ${issue.path.join('.')})`)
	}
}

const environment_validation = {
	validate_worker_environment,
	is_valid_worker_environment,
	warn_if_invalid,
	worker_environment_schema,
}

export { environment_validation }
export type { WorkerEnvironmentStrings }
