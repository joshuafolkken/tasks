import { describe, expect, it } from 'vitest'
import {
	extract_titles,
	MAX_CLEANUP_TITLES,
	MAX_TITLE_CHARS,
} from './automation-cleanup-tasks-body'

describe('extract_titles', () => {
	it('accepts a non-empty string array', () => {
		const result = extract_titles({ titles: ['E2E_FOO', 'E2E_BAR'] })

		expect(result.isOk()).toBe(true)
		if (result.isErr()) return
		expect(result.value).toEqual(['E2E_FOO', 'E2E_BAR'])
	})

	it('rejects non-objects', () => {
		expect(extract_titles(1 as unknown).isErr()).toBe(true)
		expect(extract_titles('x').isErr()).toBe(true)
	})

	it('rejects missing or non-array titles', () => {
		expect(extract_titles({}).isErr()).toBe(true)
		expect(extract_titles({ titles: 'x' }).isErr()).toBe(true)
	})

	it('rejects empty array', () => {
		expect(extract_titles({ titles: [] }).isErr()).toBe(true)
	})

	it('rejects array containing non-strings or empty strings', () => {
		expect(extract_titles({ titles: [1] }).isErr()).toBe(true)
		expect(extract_titles({ titles: [''] }).isErr()).toBe(true)
	})

	it('rejects titles exceeding MAX_TITLE_CHARS', () => {
		const long = 'a'.repeat(MAX_TITLE_CHARS + 1)

		expect(extract_titles({ titles: [long] }).isErr()).toBe(true)
	})

	it('rejects arrays exceeding MAX_CLEANUP_TITLES', () => {
		const titles = Array.from(
			{ length: MAX_CLEANUP_TITLES + 1 },
			(_, index) => `E2E_${String(index)}`,
		)

		expect(extract_titles({ titles }).isErr()).toBe(true)
	})
})
