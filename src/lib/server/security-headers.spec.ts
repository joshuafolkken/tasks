import { describe, expect, it } from 'vitest'
import { security_headers } from './security-headers'

describe('security_headers.apply_security_headers', () => {
	it('sets all security headers on the response', () => {
		const response = new Response('ok')

		security_headers.apply_security_headers(response)

		expect(response.headers.get('X-Frame-Options')).toBe('DENY')
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
		expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
		expect(response.headers.get('Permissions-Policy')).toBe(
			'camera=(), microphone=(), geolocation=()',
		)
	})
})

describe('security_headers.SECURITY_HEADERS', () => {
	it('contains exactly 4 header entries', () => {
		const EXPECTED_HEADER_COUNT = 4

		expect(security_headers.SECURITY_HEADERS).toHaveLength(EXPECTED_HEADER_COUNT)
	})
})
