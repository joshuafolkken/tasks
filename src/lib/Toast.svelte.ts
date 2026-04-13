import { toast as sonner_toast } from 'svelte-sonner'

function push_error(message: string): void {
	sonner_toast.error(message)
}

function push_success(message: string): void {
	sonner_toast.success(message)
}

function dismiss(id: string | number): void {
	sonner_toast.dismiss(id)
}

const toast = { push_error, push_success, dismiss }

export { toast }
