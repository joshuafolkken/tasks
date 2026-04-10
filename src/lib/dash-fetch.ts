import { m } from '$lib/paraglide/messages'
import { toast } from '$lib/Toast.svelte'

async function fetch_with_toast(
	url: string,
	headers: HeadersInit,
	form_data: FormData,
): Promise<Response | undefined> {
	const response = await fetch(url, {
		method: 'POST',
		headers,
		body: form_data,
	}).catch((_error: unknown): undefined => {
		toast.push_error(m.toast_network_error())
	})

	if (!response?.ok) {
		if (response !== undefined) toast.push_error(m.toast_network_error())

		return undefined
	}

	return response
}

const dash_fetch = { fetch_with_toast }

export { dash_fetch }
