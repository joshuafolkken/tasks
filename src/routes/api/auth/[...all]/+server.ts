import { get_auth } from '$lib/auth'
import type { RequestHandler } from './$types'

const handle_auth: RequestHandler = async (event) => {
	const platform = event.platform as { env: Env }
	const auth = get_auth(platform.env)

	return await auth.handler(event.request)
}

export const GET = handle_auth
export const POST = handle_auth
export const PATCH = handle_auth
export const PUT = handle_auth
export const DELETE = handle_auth
