import { afterEach, describe, expect, it } from 'vitest'
import { rate_limiter } from './rate-limiter'

const TEST_URL = 'http://localhost'

/* eslint-disable sonarjs/no-hardcoded-ip -- test constants for rate limiter verification */
const TEST_IP = '192.168.1.1'
const SECOND_IP = '10.0.0.1'
const CF_IP = '1.2.3.4'
const FORWARDED_IP = '5.6.7.8'
/* eslint-enable sonarjs/no-hardcoded-ip */

afterEach(() => {
	rate_limiter.clear_store()
})

describe('rate_limiter.is_rate_limited_path', () => {
	it('returns true for sign-in path', () => {
		expect(rate_limiter.is_rate_limited_path('/api/auth/sign-in')).toBe(true)
	})

	it('returns true for sign-up path', () => {
		expect(rate_limiter.is_rate_limited_path('/api/auth/sign-up')).toBe(true)
	})

	it('returns true for forget-password path', () => {
		expect(rate_limiter.is_rate_limited_path('/api/auth/forget-password')).toBe(true)
	})

	it('returns false for non-auth paths', () => {
		expect(rate_limiter.is_rate_limited_path('/dash')).toBe(false)
	})

	it('returns false for other auth sub-paths', () => {
		expect(rate_limiter.is_rate_limited_path('/api/auth/session')).toBe(false)
	})
})

describe('rate_limiter.check_rate_limit', () => {
	it('returns false when no requests have been made', () => {
		expect(rate_limiter.check_rate_limit(TEST_IP, Date.now())).toBe(false)
	})

	it('returns false when under the limit', () => {
		const now = Date.now()

		for (let index = 0; index < rate_limiter.MAX_REQUESTS - 1; index++) {
			rate_limiter.record_request(TEST_IP, now + index)
		}

		expect(rate_limiter.check_rate_limit(TEST_IP, now)).toBe(false)
	})

	it('returns true when at the limit', () => {
		const now = Date.now()

		for (let index = 0; index < rate_limiter.MAX_REQUESTS; index++) {
			rate_limiter.record_request(TEST_IP, now + index)
		}

		expect(rate_limiter.check_rate_limit(TEST_IP, now)).toBe(true)
	})

	it('resets after the time window expires', () => {
		const now = Date.now()

		for (let index = 0; index < rate_limiter.MAX_REQUESTS; index++) {
			rate_limiter.record_request(TEST_IP, now + index)
		}

		const after_window = now + rate_limiter.WINDOW_MS + 1

		expect(rate_limiter.check_rate_limit(TEST_IP, after_window)).toBe(false)
	})

	it('tracks IPs independently', () => {
		const now = Date.now()

		for (let index = 0; index < rate_limiter.MAX_REQUESTS; index++) {
			rate_limiter.record_request(TEST_IP, now + index)
		}

		expect(rate_limiter.check_rate_limit(SECOND_IP, now)).toBe(false)
	})
})

describe('rate_limiter.get_client_ip', () => {
	it('prefers cf-connecting-ip header', () => {
		const request = new Request(TEST_URL, {
			headers: { 'cf-connecting-ip': CF_IP, 'x-forwarded-for': FORWARDED_IP },
		})

		expect(rate_limiter.get_client_ip(request)).toBe(CF_IP)
	})

	it('falls back to x-forwarded-for', () => {
		const request = new Request(TEST_URL, {
			headers: { 'x-forwarded-for': FORWARDED_IP },
		})

		expect(rate_limiter.get_client_ip(request)).toBe(FORWARDED_IP)
	})

	it('falls back to 0.0.0.0 when no IP headers present', () => {
		const request = new Request(TEST_URL)

		expect(rate_limiter.get_client_ip(request)).toBe('0.0.0.0')
	})
})

describe('rate_limiter.get_retry_after_seconds', () => {
	it('returns 0 when no requests recorded', () => {
		expect(rate_limiter.get_retry_after_seconds(TEST_IP, Date.now())).toBe(0)
	})

	it('returns positive seconds when requests exist within window', () => {
		const now = Date.now()

		rate_limiter.record_request(TEST_IP, now)

		const retry_after = rate_limiter.get_retry_after_seconds(TEST_IP, now)

		expect(retry_after).toBeGreaterThan(0)
		expect(retry_after).toBeLessThanOrEqual(rate_limiter.WINDOW_MS / rate_limiter.MS_PER_SECOND)
	})
})
