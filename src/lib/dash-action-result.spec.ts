import type { ActionResult } from '@sveltejs/kit'
import { describe, expect, it } from 'vitest'
import { dash_action_result } from './dash-action-result'

const FAILURE_RESULT: ActionResult = { type: 'failure', status: 400 }

describe('dash_action_result.read_focus_task_id_from_action', () => {
	it('returns undefined when the action did not succeed', () => {
		expect(dash_action_result.read_focus_task_id_from_action(FAILURE_RESULT)).toBeUndefined()
	})

	it('returns the focus id when present on success data', () => {
		const result: ActionResult = {
			type: 'success',
			status: 200,
			data: { focus_task_id: 'tid-1' },
		}

		expect(dash_action_result.read_focus_task_id_from_action(result)).toBe('tid-1')
	})

	it('returns undefined when focus id is missing or empty', () => {
		const without_key: ActionResult = { type: 'success', status: 200, data: {} }
		const empty: ActionResult = { type: 'success', status: 200, data: { focus_task_id: '' } }

		expect(dash_action_result.read_focus_task_id_from_action(without_key)).toBeUndefined()
		expect(dash_action_result.read_focus_task_id_from_action(empty)).toBeUndefined()
	})
})

describe('dash_action_result.read_task_id_from_action', () => {
	it('returns undefined when create (or any) action did not succeed', () => {
		expect(dash_action_result.read_task_id_from_action(FAILURE_RESULT)).toBeUndefined()
	})

	it('returns task_id from success data', () => {
		const result: ActionResult = {
			type: 'success',
			status: 200,
			data: { task_id: 'new-1', success: true },
		}

		expect(dash_action_result.read_task_id_from_action(result)).toBe('new-1')
	})

	it('returns undefined when task_id is missing', () => {
		const result: ActionResult = { type: 'success', status: 200, data: { success: true } }

		expect(dash_action_result.read_task_id_from_action(result)).toBeUndefined()
	})
})
