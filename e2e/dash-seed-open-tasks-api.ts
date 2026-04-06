import type { Page } from '@playwright/test'

const SEED_OPEN_TASKS_PATH = '/api/test/seed-open-tasks'

async function try_seed_open_tasks_via_api(page: Page, titles: Array<string>): Promise<boolean> {
	try {
		const response = await page.request.post(SEED_OPEN_TASKS_PATH, { data: { titles } })

		return response.ok()
	} catch {
		return false
	}
}

export { try_seed_open_tasks_via_api }
