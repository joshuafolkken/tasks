import { dev } from '$app/environment'

/** Gate for `/api/test/*` helpers used by Playwright (seed, cleanup). */
function is_playwright_test_api_enabled(): boolean {
	return process.env['E2E_CLEANUP_ENABLED'] === '1' || dev
}

export { is_playwright_test_api_enabled }
