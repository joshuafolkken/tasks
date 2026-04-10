import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast, toast_store } from './Toast.svelte'

const MSG_SOMETHING_WRONG = 'Something went wrong'
const MSG_TEMPORARY_ERROR = 'Temporary error'

describe('toast store', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		toast_store.items = []
	})

	afterEach(() => {
		vi.useRealTimers()
		toast_store.items = []
	})

	it('push_error adds an error item', () => {
		toast.push_error(MSG_SOMETHING_WRONG)

		expect(toast_store.items).toHaveLength(1)
		expect(toast_store.items[0].message).toBe(MSG_SOMETHING_WRONG)
		expect(toast_store.items[0].type).toBe('error')
	})

	it('dismiss removes the item by id', () => {
		toast.push_error('Error A')
		toast.push_error('Error B')

		const first_id = toast_store.items[0]?.id ?? -1

		toast.dismiss(first_id)

		expect(toast_store.items).toHaveLength(1)
		expect(toast_store.items[0]?.message).toBe('Error B')
	})

	it('auto-dismisses after 4 seconds', () => {
		toast.push_error(MSG_TEMPORARY_ERROR)

		expect(toast_store.items).toHaveLength(1)

		vi.advanceTimersByTime(4000)

		expect(toast_store.items).toHaveLength(0)
	})

	it('does not dismiss before 4 seconds', () => {
		toast.push_error(MSG_TEMPORARY_ERROR)

		vi.advanceTimersByTime(3999)

		expect(toast_store.items).toHaveLength(1)
	})
})
