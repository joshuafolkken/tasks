import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { DEMO_SUPABASE_ROUTES } from '$lib/routes'
import type { RequestHandler } from './$types'

// eslint-disable-next-line max-statements
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash')
	const type = url.searchParams.get('type') as EmailOtpType | null
	const next = url.searchParams.get('next') ?? DEMO_SUPABASE_ROUTES.ACCOUNT
	const redirect_to = new URL(url)

	redirect_to.pathname = next
	redirect_to.searchParams.delete('token_hash')
	redirect_to.searchParams.delete('type')

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash })

		if (!error) {
			redirect_to.searchParams.delete('next')
			redirect(HTTP_STATUS.SEE_OTHER, redirect_to)
		}
	}

	redirect_to.pathname = DEMO_SUPABASE_ROUTES.AUTH_ERROR
	redirect(HTTP_STATUS.SEE_OTHER, redirect_to)
}
