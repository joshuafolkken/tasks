import { describe, expect, it } from 'vitest'
import { parse_seed_open_tasks_json } from './automation-seed-open-tasks-body'

describe('parse_seed_open_tasks_json', () => {
	it('accepts a non-empty trimmed title list', () => {
		const result = parse_seed_open_tasks_json({ titles: ['  a  ', 'b'] })

		expect(result.isOk()).toBe(true)
		if (result.isErr()) return
		expect(result.value).toEqual(['a', 'b'])
	})

	it('rejects non-objects', () => {
		expect(parse_seed_open_tasks_json(1 as unknown).isErr()).toBe(true)
		expect(parse_seed_open_tasks_json('x').isErr()).toBe(true)
	})

	it('rejects missing or non-array titles', () => {
		expect(parse_seed_open_tasks_json({}).isErr()).toBe(true)
		expect(parse_seed_open_tasks_json({ titles: 1 }).isErr()).toBe(true)
	})

	it('rejects empty titles array or blank strings', () => {
		expect(parse_seed_open_tasks_json({ titles: [] }).isErr()).toBe(true)
		expect(parse_seed_open_tasks_json({ titles: ['  '] }).isErr()).toBe(true)
	})
})
