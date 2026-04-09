import { describe, expect, it } from 'vitest'
import { dash_server_actions } from './dash-server-actions'

describe('dash_server_actions.compute_reorder_sort_order', () => {
	it('creates a key between neighbors', () => {
		const result = dash_server_actions.compute_reorder_sort_order('a0', 'a1')

		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.sort_order > 'a0').toBe(true)
		expect(result.sort_order < 'a1').toBe(true)
	})

	it('creates a key at the list head when prev is empty', () => {
		const result = dash_server_actions.compute_reorder_sort_order('', 'a0')

		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.sort_order < 'a0').toBe(true)
	})

	it('creates a key at the list tail when next is empty', () => {
		const result = dash_server_actions.compute_reorder_sort_order('a0', '')

		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.sort_order > 'a0').toBe(true)
	})

	it('returns error when neighbor order is invalid', () => {
		const result = dash_server_actions.compute_reorder_sort_order('b', 'a')

		expect(result.ok).toBe(false)
	})
})
