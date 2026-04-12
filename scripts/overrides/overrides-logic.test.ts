import { describe, expect, it } from 'vitest'
import { overrides_check } from './overrides-logic'

function make_overrides(entries: Array<[string, string]>): Record<string, string> {
	return Object.fromEntries(entries)
}

const CSPELL_KEY = 'cspell@>=10'
const CSPELL_VALUE = '^9'
const ESBUILD_KEY = 'esbuild@<=0.24.2'
const ESBUILD_VALUE = '>=0.25.0'
const NEW_PKG_KEY = 'new-pkg@>=1'

describe('overrides_check.compare — no changes', () => {
	it('returns no changes for identical overrides', () => {
		const overrides = make_overrides([
			[CSPELL_KEY, CSPELL_VALUE],
			[ESBUILD_KEY, ESBUILD_VALUE],
		])
		const result = overrides_check.compare(overrides, { ...overrides })

		expect(result.is_changed).toBe(false)
		expect(result.added).toHaveLength(0)
		expect(result.removed).toHaveLength(0)
		expect(result.modified).toHaveLength(0)
	})

	it('handles empty overrides on both sides', () => {
		const result = overrides_check.compare({}, {})

		expect(result.is_changed).toBe(false)
	})
})

describe('overrides_check.compare — added and removed', () => {
	it('detects added entries', () => {
		const snapshot = make_overrides([[CSPELL_KEY, CSPELL_VALUE]])
		const current = make_overrides([
			[CSPELL_KEY, CSPELL_VALUE],
			[NEW_PKG_KEY, '^2'],
		])
		const result = overrides_check.compare(snapshot, current)

		expect(result.is_changed).toBe(true)
		expect(result.added).toEqual([{ key: NEW_PKG_KEY, value: '^2' }])
	})

	it('detects removed entries', () => {
		const snapshot = make_overrides([
			[CSPELL_KEY, CSPELL_VALUE],
			[ESBUILD_KEY, ESBUILD_VALUE],
		])
		const current = make_overrides([[ESBUILD_KEY, ESBUILD_VALUE]])
		const result = overrides_check.compare(snapshot, current)

		expect(result.is_changed).toBe(true)
		expect(result.removed).toEqual([{ key: CSPELL_KEY, value: CSPELL_VALUE }])
	})
})

describe('overrides_check.compare — modified and mixed', () => {
	it('detects modified entries', () => {
		const snapshot = make_overrides([[CSPELL_KEY, CSPELL_VALUE]])
		const current = make_overrides([[CSPELL_KEY, '^10']])
		const result = overrides_check.compare(snapshot, current)

		expect(result.is_changed).toBe(true)
		expect(result.modified).toEqual([
			{ key: CSPELL_KEY, old_value: CSPELL_VALUE, new_value: '^10' },
		])
	})

	it('detects multiple changes at once', () => {
		const snapshot = make_overrides([
			['a', '1'],
			['b', '2'],
			['c', '3'],
		])
		const current = make_overrides([
			['a', '1'],
			['b', '99'],
			['d', '4'],
		])
		const result = overrides_check.compare(snapshot, current)

		expect(result.is_changed).toBe(true)
		expect(result.added).toEqual([{ key: 'd', value: '4' }])
		expect(result.removed).toEqual([{ key: 'c', value: '3' }])
		expect(result.modified).toEqual([{ key: 'b', old_value: '2', new_value: '99' }])
	})
})

describe('overrides_check.read_overrides_from_package', () => {
	it('extracts overrides from package.json content', () => {
		const overrides = make_overrides([['foo@>=1', '^2']])
		const content = JSON.stringify({ pnpm: { overrides } })

		expect(overrides_check.read_overrides_from_package(content)).toEqual(overrides)
	})

	it('returns empty object when no pnpm section', () => {
		const content = JSON.stringify({ name: 'test' })

		expect(overrides_check.read_overrides_from_package(content)).toEqual({})
	})

	it('returns empty object when no overrides section', () => {
		const content = JSON.stringify({ pnpm: {} })

		expect(overrides_check.read_overrides_from_package(content)).toEqual({})
	})
})
