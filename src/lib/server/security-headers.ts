import type { Handle } from '@sveltejs/kit'

const SECURITY_HEADERS: ReadonlyArray<readonly [string, string]> = [
	['X-Frame-Options', 'DENY'],
	['X-Content-Type-Options', 'nosniff'],
	['Referrer-Policy', 'strict-origin-when-cross-origin'],
	['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
]

function apply_security_headers(response: Response): void {
	for (const [name, value] of SECURITY_HEADERS) {
		response.headers.set(name, value)
	}
}

const handle_security_headers: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)

	apply_security_headers(response)

	return response
}

const security_headers = { handle_security_headers, apply_security_headers, SECURITY_HEADERS }

export { security_headers }
