import { describe, expect, it } from 'vitest'
import { environment_validation } from './environment-validation'

const VALID_ENVIRONMENT = {
	BETTER_AUTH_SECRET: 'test-secret-value',
	BETTER_AUTH_URL: 'http://localhost:5173',
	GOOGLE_CLIENT_ID: 'google-id',
	GOOGLE_CLIENT_SECRET: 'google-secret',
	AUTH_GITHUB_CLIENT_ID: 'github-id',
	AUTH_GITHUB_CLIENT_SECRET: 'github-secret',
	TELEGRAM_BOT_TOKEN: 'bot-token',
	TELEGRAM_CHAT_ID: 'chat-id',
}

describe('environment_validation.validate_worker_environment', () => {
	it('accepts a complete valid environment', () => {
		expect(() =>
			environment_validation.validate_worker_environment(VALID_ENVIRONMENT),
		).not.toThrow()
	})

	it('rejects when BETTER_AUTH_SECRET is missing', () => {
		const partial = { ...VALID_ENVIRONMENT }

		delete (partial as Record<string, unknown>)['BETTER_AUTH_SECRET']

		expect(() => environment_validation.validate_worker_environment(partial)).toThrow()
	})

	it('rejects when BETTER_AUTH_URL is not a valid URL', () => {
		const environment = { ...VALID_ENVIRONMENT, BETTER_AUTH_URL: 'not-a-url' }

		expect(() => environment_validation.validate_worker_environment(environment)).toThrow()
	})

	it('rejects empty string for required fields', () => {
		const environment = { ...VALID_ENVIRONMENT, TELEGRAM_BOT_TOKEN: '' }

		expect(() => environment_validation.validate_worker_environment(environment)).toThrow()
	})
})

describe('environment_validation.is_valid_worker_environment', () => {
	it('returns true for valid environment', () => {
		expect(environment_validation.is_valid_worker_environment(VALID_ENVIRONMENT)).toBe(true)
	})

	it('returns false for incomplete environment', () => {
		expect(environment_validation.is_valid_worker_environment({})).toBe(false)
	})
})
