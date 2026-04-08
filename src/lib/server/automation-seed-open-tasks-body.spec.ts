import { describe, expect, it } from 'vitest'
import { parse_seed_open_tasks_json } from './automation-seed-open-tasks-body'

describe('parse_seed_open_tasks_json', () => {
	it('accepts a non-empty trimmed title list', () => {
		const result = parse_seed_open_tasks_json({ titles: ['  a  ', 'b'] })

		expect(result).toEqual({ ok: true, titles: ['a', 'b'] })
	})

	it('rejects non-objects', () => {
		expect(parse_seed_open_tasks_json(1 as unknown).ok).toBe(false)
		expect(parse_seed_open_tasks_json('x').ok).toBe(false)
	})

	it('rejects missing or non-array titles', () => {
		expect(parse_seed_open_tasks_json({}).ok).toBe(false)
		expect(parse_seed_open_tasks_json({ titles: 1 }).ok).toBe(false)
	})

	it('rejects empty titles array or blank strings', () => {
		expect(parse_seed_open_tasks_json({ titles: [] }).ok).toBe(false)
		expect(parse_seed_open_tasks_json({ titles: ['  '] }).ok).toBe(false)
	})
})
