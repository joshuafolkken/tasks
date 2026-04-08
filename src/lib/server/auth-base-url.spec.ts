import { describe, expect, it } from 'vitest'
import { auth_base_url_module } from './auth-base-url'

const SAMPLE_PRODUCTION_AUTH_URL = 'https://tasks.example.com'

const EXPECTED_DYNAMIC_BASE = {
	allowedHosts: ['localhost*', '127.0.0.1*'],
	fallback: SAMPLE_PRODUCTION_AUTH_URL,
	protocol: 'auto' as const,
}

describe('auth_base_url_module.resolve_auth_base_url (static)', () => {
	it('returns static URL when not Vite dev and not E2E cleanup', () => {
		expect(
			auth_base_url_module.resolve_auth_base_url({
				better_auth_url: SAMPLE_PRODUCTION_AUTH_URL,
				is_vite_dev: false,
				is_e2e_cleanup: false,
			}),
		).toBe(SAMPLE_PRODUCTION_AUTH_URL)
	})
})

describe('auth_base_url_module.resolve_auth_base_url (Vite dev)', () => {
	it('returns dynamic config so localhost matches Host with port', () => {
		expect(
			auth_base_url_module.resolve_auth_base_url({
				better_auth_url: SAMPLE_PRODUCTION_AUTH_URL,
				is_vite_dev: true,
				is_e2e_cleanup: false,
			}),
		).toEqual(EXPECTED_DYNAMIC_BASE)
	})
})

describe('auth_base_url_module.resolve_auth_base_url (E2E cleanup)', () => {
	it('returns dynamic config for CI preview worker', () => {
		expect(
			auth_base_url_module.resolve_auth_base_url({
				better_auth_url: SAMPLE_PRODUCTION_AUTH_URL,
				is_vite_dev: false,
				is_e2e_cleanup: true,
			}),
		).toEqual(EXPECTED_DYNAMIC_BASE)
	})
})
