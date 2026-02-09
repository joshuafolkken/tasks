import { redirect } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code')
	const next = url.searchParams.get('next') ?? '/account'

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code)

		if (!error) {
			redirect(HTTP_STATUS.SEE_OTHER, next)
		}
	}

	redirect(HTTP_STATUS.SEE_OTHER, '/auth/error')
}
