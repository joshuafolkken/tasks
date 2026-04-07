import { existsSync } from 'node:fs'
import { test as base } from '@playwright/test'
import { worker_auth_path } from './e2e-constants'
import { SAVED_AUTH_STORAGE } from './saved-auth-storage-path'

interface WorkerFixtures {
	worker_storage_path: string
}

function resolve_storage_path(worker_storage_path: string): string | undefined {
	if (existsSync(worker_storage_path)) return worker_storage_path

	const legacy_path = SAVED_AUTH_STORAGE.FILE_PATH

	if (existsSync(legacy_path)) return legacy_path

	return undefined
}

// eslint-disable-next-line no-restricted-syntax -- Playwright fixture must be exported as `test`; namespace export would break test file imports
export const test = base.extend<NonNullable<unknown>, WorkerFixtures>({
	worker_storage_path: [
		// eslint-disable-next-line no-empty-pattern -- Playwright fixture API requires object destructuring for first arg
		async ({}, use, worker_info) => {
			await use(worker_auth_path(worker_info.workerIndex))
		},
		{ scope: 'worker' },
	],

	storageState: async ({ worker_storage_path }, use) => {
		await use(resolve_storage_path(worker_storage_path))
	},
})

export * from '@playwright/test'
