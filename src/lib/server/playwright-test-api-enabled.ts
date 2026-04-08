import { dev } from '$app/environment'
import { worker_environment } from '$lib/server/worker-environment'

const { environment } = worker_environment

/** Gate for `/api/test/*` helpers used by Playwright (seed, cleanup). */
function is_playwright_test_api_enabled(): boolean {
	return import.meta.env.E2E_CLEANUP_ENABLED || environment.E2E_CLEANUP_ENABLED === '1' || dev
}

export { is_playwright_test_api_enabled }
