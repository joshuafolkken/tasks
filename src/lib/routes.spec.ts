import { describe, expect, it } from 'vitest'
import { POST_AUTH_REDIRECT, ROUTES } from './routes'

describe('routes', () => {
	it('exposes expected paths', () => {
		expect(ROUTES.HOME).toBe('/')
		expect(ROUTES.DASH).toBe('/dash')
		expect(ROUTES.LOGIN).toBe('/login')
		expect(POST_AUTH_REDIRECT).toBe(ROUTES.HOME)
	})
})
