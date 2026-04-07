import { mkdirSync } from 'node:fs'
import { request, type APIRequestContext } from '@playwright/test'
import {
	E2E_AUTH_DIR,
	E2E_TEST_PASSWORD,
	E2E_WORKER_COUNT,
	worker_auth_path,
	worker_email,
} from './e2e-constants'

const SIGN_UP_PATH = '/api/auth/sign-up/email'
const SIGN_IN_PATH = '/api/auth/sign-in/email'
const is_ci = Boolean(process.env['CI'])
const DEV_PORT = 5173
const PREVIEW_PORT = 4173
const SETUP_BASE_URL = `http://localhost:${String(is_ci ? PREVIEW_PORT : DEV_PORT)}`

async function try_sign_up(context: APIRequestContext, email: string): Promise<void> {
	// Ignore response — user may already exist from a prior run
	await context.post(SIGN_UP_PATH, {
		data: { email, password: E2E_TEST_PASSWORD, name: 'E2E Worker' },
	})
}

async function sign_in_and_save(
	context: APIRequestContext,
	email: string,
	auth_path: string,
): Promise<void> {
	const response = await context.post(SIGN_IN_PATH, {
		data: { email, password: E2E_TEST_PASSWORD },
	})

	if (!response.ok()) throw new Error(`Auth failed for ${email}: ${String(response.status())}`)

	await context.storageState({ path: auth_path })
}

async function setup_worker_auth(worker_index: number): Promise<void> {
	const email = worker_email(worker_index)
	const auth_path = worker_auth_path(worker_index)
	const context = await request.newContext({
		baseURL: SETUP_BASE_URL,
		extraHTTPHeaders: { origin: SETUP_BASE_URL },
	})

	try {
		await try_sign_up(context, email)
		await sign_in_and_save(context, email, auth_path)
	} finally {
		await context.dispose()
	}
}

// eslint-disable-next-line import/no-default-export -- Playwright globalSetup requires a default export
export default async function global_setup(): Promise<void> {
	mkdirSync(E2E_AUTH_DIR, { recursive: true })
	await Promise.all(
		Array.from({ length: E2E_WORKER_COUNT }, async (_, index) => {
			await setup_worker_auth(index)
		}),
	)
}
