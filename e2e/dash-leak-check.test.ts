import { existsSync } from 'node:fs'
import { test } from '@playwright/test'
import { dash_leak_guard } from './dash-leak-check'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

const LEAK_GUARD_TIMEOUT_MS = 120_000

test.describe('Dash E2E data leak guard', () => {
	test.setTimeout(LEAK_GUARD_TIMEOUT_MS)

	test('no E2E_* tasks remain on any localized dash after other E2E tests', async ({ page }) => {
		test.skip(
			!existsSync(SAVED_AUTH_STORAGE.FILE_PATH),
			`Missing auth storage at ${SAVED_AUTH_STORAGE.FILE_PATH}. Create it with pnpm test:e2e:save-auth (or equivalent).`,
		)

		await dash_leak_guard.scrub_then_assert_clean(page)
	})
})
