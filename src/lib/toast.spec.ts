import { toast as sonner_toast } from 'svelte-sonner'
import { describe, expect, it, vi } from 'vitest'
import { toast } from './Toast.svelte'

vi.mock('svelte-sonner', () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
		dismiss: vi.fn(),
	},
}))

const MSG_SOMETHING_WRONG = 'Something went wrong'
const MSG_TASK_CREATED = 'Task created'

describe('toast wrapper delegates to svelte-sonner', () => {
	it('push_error calls sonner toast.error', () => {
		toast.push_error(MSG_SOMETHING_WRONG)

		expect(sonner_toast.error).toHaveBeenCalledWith(MSG_SOMETHING_WRONG)
	})

	it('push_success calls sonner toast.success', () => {
		toast.push_success(MSG_TASK_CREATED)

		expect(sonner_toast.success).toHaveBeenCalledWith(MSG_TASK_CREATED)
	})

	it('dismiss calls sonner toast.dismiss', () => {
		const SAMPLE_ID = 42

		toast.dismiss(SAMPLE_ID)

		expect(sonner_toast.dismiss).toHaveBeenCalledWith(SAMPLE_ID)
	})
})
