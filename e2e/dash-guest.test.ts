import { expect, test } from '@playwright/test'

const DASH_REDIRECT_LOAD_TIMEOUT_MS = 25_000

test.describe('/dash', () => {
	test('redirects to login when unauthenticated', async ({ page }) => {
		await page.goto('/dash', { waitUntil: 'load', timeout: DASH_REDIRECT_LOAD_TIMEOUT_MS })
		expect(page.url()).toContain('/login')
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
	})
})
