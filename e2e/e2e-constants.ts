/* eslint-disable unicorn/prevent-abbreviations -- e2e is a well-known testing abbreviation */
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Must stay in sync with `pnpm dev` default. */
const E2E_DEV_PORT = 5173
/** Playwright `preview:ci` / wrangler local preview. */
const E2E_PREVIEW_PORT = 4173

/** Preview port on CI, dev server port locally. */
function resolve_local_web_base_url(): string {
	const is_ci = Boolean(process.env['CI'])
	const port = is_ci ? E2E_PREVIEW_PORT : E2E_DEV_PORT

	return `http://localhost:${String(port)}`
}

function parse_e2e_workers_from_env(): number | undefined {
	const raw = process.env['E2E_WORKERS']

	if (raw === undefined || raw === '') return undefined

	const parsed = Number(raw)

	if (!Number.isFinite(parsed) || parsed < 1) return undefined

	return Math.floor(parsed)
}

/** Max local workers to prevent dev server overload under parallel load. */
const LOCAL_MAX_WORKERS = 4

function resolve_e2e_worker_count(): number {
	const from_env = parse_e2e_workers_from_env()

	if (from_env !== undefined) return from_env

	const parallelism = Math.max(1, os.availableParallelism())
	const is_ci = Boolean(process.env['CI'])

	return is_ci ? parallelism : Math.min(parallelism, LOCAL_MAX_WORKERS)
}

const E2E_WORKER_COUNT = resolve_e2e_worker_count()
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test-only internal password, never used in production
const E2E_TEST_PASSWORD = 'e2e-internal-test-pw'
const E2E_AUTH_DIR = path.join(fileURLToPath(new URL('.', import.meta.url)), '.auth')

function worker_auth_path(worker_index: number): string {
	return path.join(E2E_AUTH_DIR, `worker-${String(worker_index)}.json`)
}

function worker_email(worker_index: number): string {
	return `e2e-worker-${String(worker_index)}@test.internal`
}

export {
	E2E_AUTH_DIR,
	E2E_DEV_PORT,
	E2E_PREVIEW_PORT,
	E2E_TEST_PASSWORD,
	E2E_WORKER_COUNT,
	resolve_local_web_base_url,
	worker_auth_path,
	worker_email,
}
