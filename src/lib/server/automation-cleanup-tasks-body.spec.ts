import { describe, expect, it } from 'vitest'
import {
	extract_titles,
	MAX_CLEANUP_TITLES,
	MAX_TITLE_CHARS,
} from './automation-cleanup-tasks-body'

describe('extract_titles', () => {
	it('accepts a non-empty string array', () => {
		const result = extract_titles({ titles: ['E2E_FOO', 'E2E_BAR'] })

		expect(result).toEqual({ ok: true, titles: ['E2E_FOO', 'E2E_BAR'] })
	})

	it('rejects non-objects', () => {
		expect(extract_titles(1 as unknown).ok).toBe(false)
		expect(extract_titles('x').ok).toBe(false)
	})

	it('rejects missing or non-array titles', () => {
		expect(extract_titles({}).ok).toBe(false)
		expect(extract_titles({ titles: 'x' }).ok).toBe(false)
	})

	it('rejects empty array', () => {
		expect(extract_titles({ titles: [] }).ok).toBe(false)
	})

	it('rejects array containing non-strings or empty strings', () => {
		expect(extract_titles({ titles: [1] }).ok).toBe(false)
		expect(extract_titles({ titles: [''] }).ok).toBe(false)
	})

	it('rejects titles exceeding MAX_TITLE_CHARS', () => {
		const long = 'a'.repeat(MAX_TITLE_CHARS + 1)

		expect(extract_titles({ titles: [long] }).ok).toBe(false)
	})

	it('rejects arrays exceeding MAX_CLEANUP_TITLES', () => {
		const titles = Array.from(
			{ length: MAX_CLEANUP_TITLES + 1 },
			(_, index) => `E2E_${String(index)}`,
		)

		expect(extract_titles({ titles }).ok).toBe(false)
	})
})
