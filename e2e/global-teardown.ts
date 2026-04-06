import { existsSync } from 'node:fs'
import { request, type FullConfig } from '@playwright/test'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

const CLEANUP_TIMEOUT_MS = 30_000
const CLEANUP_PATH = '/api/test/cleanup-tasks'
const is_ci = Boolean(process.env['CI'])
const DEV_PORT = 5173
const PREVIEW_PORT = 4173
const TEARDOWN_BASE_URL = `http://localhost:${String(is_ci ? PREVIEW_PORT : DEV_PORT)}`

async function run_cleanup(base_url: string): Promise<void> {
	const api_context = await request.newContext({
		baseURL: base_url,
		storageState: SAVED_AUTH_STORAGE.FILE_PATH,
	})

	try {
		const response = await api_context.post(CLEANUP_PATH, { timeout: CLEANUP_TIMEOUT_MS })
		const FORBIDDEN = 403

		if (response.status() === FORBIDDEN) return

		if (!response.ok()) {
			throw new Error(`cleanup-tasks returned unexpected ${String(response.status())}`)
		}
	} finally {
		await api_context.dispose()
	}
}

// eslint-disable-next-line import/no-default-export -- Playwright globalTeardown requires a default export
export default async function global_teardown(_config: FullConfig): Promise<void> {
	if (!existsSync(SAVED_AUTH_STORAGE.FILE_PATH)) return

	await run_cleanup(TEARDOWN_BASE_URL)
}
