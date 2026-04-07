/* eslint-disable unicorn/prevent-abbreviations -- e2e is a well-known testing abbreviation */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const E2E_WORKER_COUNT = 4
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test-only internal password, never used in production
const E2E_TEST_PASSWORD = 'e2e-internal-test-pw'
const E2E_AUTH_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), '.auth')

function worker_auth_path(worker_index: number): string {
	return path.join(E2E_AUTH_DIR, `worker-${String(worker_index)}.json`)
}

function worker_email(worker_index: number): string {
	return `e2e-worker-${String(worker_index)}@test.internal`
}

export { E2E_WORKER_COUNT, E2E_TEST_PASSWORD, E2E_AUTH_DIR, worker_auth_path, worker_email }
