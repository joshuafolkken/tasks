import { existsSync } from 'node:fs'
import { DASH_JA_PAGE_HEADING } from './dash-ja-strings'
import { worker_auth_path } from './e2e-constants'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'
import { expect, test } from './worker-fixtures'

const JA_DASH_LOAD_TIMEOUT_MS = 25_000

test.describe('/dash', () => {
	test('shows the dashboard when authenticated', async ({ page }) => {
		const worker_index = test.info().workerIndex
		const has_auth =
			existsSync(worker_auth_path(worker_index)) || existsSync(SAVED_AUTH_STORAGE.FILE_PATH)

		test.skip(!has_auth, 'Missing auth storage. Start server with E2E_CLEANUP_ENABLED=1.')

		await page.goto('/ja/dash', { waitUntil: 'load', timeout: JA_DASH_LOAD_TIMEOUT_MS })
		expect(page.url()).toMatch(/\/dash/u)
		await expect(page.getByRole('heading', { level: 1, name: DASH_JA_PAGE_HEADING })).toBeVisible()
	})
})
