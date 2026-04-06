import { existsSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { DASH_JA_PAGE_HEADING } from './dash-ja-strings'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

const JA_DASH_LOAD_TIMEOUT_MS = 25_000

test.describe('/dash', () => {
	test('shows the dashboard when authenticated', async ({ page }) => {
		test.skip(
			!existsSync(SAVED_AUTH_STORAGE.FILE_PATH),
			`Missing auth storage at ${SAVED_AUTH_STORAGE.FILE_PATH}. Copy e2e/.auth/user.json.example and replace with real storage from a logged-in session (e.g. Playwright save-storage).`,
		)

		await page.goto('/ja/dash', { waitUntil: 'load', timeout: JA_DASH_LOAD_TIMEOUT_MS })
		expect(page.url()).toMatch(/\/dash/u)
		await expect(page.getByRole('heading', { level: 1, name: DASH_JA_PAGE_HEADING })).toBeVisible()
	})
})
