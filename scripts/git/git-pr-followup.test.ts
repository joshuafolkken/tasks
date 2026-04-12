import { describe, expect, it } from 'vitest'
import { is_blank_issue_body } from './git-pr-followup'

describe('is_blank_issue_body', () => {
	it('returns true for undefined', () => {
		// eslint-disable-next-line unicorn/no-useless-undefined -- explicitly testing undefined input
		expect(is_blank_issue_body(undefined)).toBe(true)
	})

	it('returns true for empty string', () => {
		expect(is_blank_issue_body('')).toBe(true)
	})

	it('returns true for whitespace-only string', () => {
		expect(is_blank_issue_body('   \n\t  ')).toBe(true)
	})

	it('returns false for non-empty body', () => {
		expect(is_blank_issue_body('## Background\nSome content')).toBe(false)
	})

	it('returns false for body with leading whitespace and content', () => {
		expect(is_blank_issue_body('  content  ')).toBe(false)
	})
})
