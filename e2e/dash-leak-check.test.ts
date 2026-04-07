import { existsSync } from 'node:fs'
import { dash_leak_guard } from './dash-leak-check'
import { worker_auth_path } from './e2e-constants'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'
import { test } from './worker-fixtures'

const LEAK_GUARD_TIMEOUT_MS = 120_000

test.describe('Dash E2E data leak guard', () => {
	test.setTimeout(LEAK_GUARD_TIMEOUT_MS)

	test('no E2E_* tasks remain on any localized dash after other E2E tests', async ({ page }) => {
		const worker_index = test.info().workerIndex
		const has_auth =
			existsSync(worker_auth_path(worker_index)) || existsSync(SAVED_AUTH_STORAGE.FILE_PATH)

		test.skip(!has_auth, 'Missing auth storage. Start server with E2E_CLEANUP_ENABLED=1.')

		await dash_leak_guard.scrub_then_assert_clean(page)
	})
})
