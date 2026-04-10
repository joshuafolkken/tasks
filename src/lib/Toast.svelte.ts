const TOAST_AUTO_DISMISS_MS = 4000

type ToastType = 'error'

interface ToastItem {
	id: number
	message: string
	type: ToastType
}

let next_id = 0

const toast_store = $state<{ items: Array<ToastItem> }>({ items: [] })

function dismiss(id: number): void {
	toast_store.items = toast_store.items.filter((item) => item.id !== id)
}

function push_error(message: string): void {
	const id = next_id

	next_id += 1
	toast_store.items = [...toast_store.items, { id, message, type: 'error' }]
	setTimeout(() => {
		dismiss(id)
	}, TOAST_AUTO_DISMISS_MS)
}

const toast = { push_error, dismiss }

export { toast, toast_store }
export type { ToastItem }
