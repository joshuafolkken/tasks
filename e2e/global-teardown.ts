import { existsSync } from 'node:fs'
import { request, type FullConfig } from '@playwright/test'
import { E2E_WORKER_COUNT, worker_auth_path } from './e2e-constants'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

const CLEANUP_TIMEOUT_MS = 30_000
const CLEANUP_PATH = '/api/test/cleanup-tasks'
const is_ci = Boolean(process.env['CI'])
const DEV_PORT = 5173
const PREVIEW_PORT = 4173
const TEARDOWN_BASE_URL = `http://localhost:${String(is_ci ? PREVIEW_PORT : DEV_PORT)}`

async function run_cleanup(base_url: string, auth_path: string): Promise<void> {
	const api_context = await request.newContext({
		baseURL: base_url,
		storageState: auth_path,
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

function collect_auth_paths(): Array<string> {
	const worker_paths = Array.from({ length: E2E_WORKER_COUNT }, (_, index) =>
		worker_auth_path(index),
	).filter((auth_path) => existsSync(auth_path))

	const legacy = SAVED_AUTH_STORAGE.FILE_PATH
	const legacy_paths = existsSync(legacy) ? [legacy] : []

	return [...worker_paths, ...legacy_paths]
}

// eslint-disable-next-line import/no-default-export -- Playwright globalTeardown requires a default export
export default async function global_teardown(_config: FullConfig): Promise<void> {
	const auth_paths = collect_auth_paths()
	if (auth_paths.length === 0) return

	await Promise.all(
		auth_paths.map(async (auth_path) => {
			await run_cleanup(TEARDOWN_BASE_URL, auth_path)
		}),
	)
}
