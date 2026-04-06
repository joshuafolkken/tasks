import { describe, expect, it } from 'vitest'
import { dash_edit_chain } from './dash-edit-chain'

describe('dash_edit_chain', () => {
	it('moves to the next task id when one exists', () => {
		expect(dash_edit_chain.next_focus_after_task_save(['a', 'b', 'c'], 'a')).toEqual({
			mode: 'next_task',
			task_id: 'b',
		})
	})

	it('opens create when current is last', () => {
		expect(dash_edit_chain.next_focus_after_task_save(['a', 'b'], 'b')).toEqual({ mode: 'create' })
	})

	it('opens create when current id is missing', () => {
		expect(dash_edit_chain.next_focus_after_task_save(['a'], 'x')).toEqual({ mode: 'create' })
	})

	it('opens create for a single-task list', () => {
		expect(dash_edit_chain.next_focus_after_task_save(['only'], 'only')).toEqual({ mode: 'create' })
	})
})
