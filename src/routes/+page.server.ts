import { fail, redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { safe_get_session } }) => {
	const { session } = await safe_get_session()

	if (session !== null) {
		redirect(HTTP_STATUS.SEE_OTHER, '/account')
	}

	return { url: url.toString() }
}

export const actions: Actions = {
	// eslint-disable-next-line max-lines-per-function
	default: async (event) => {
		const {
			request,
			locals: { supabase },
		} = event

		const form_data = await request.formData()
		const email = form_data.get('email') as string
		const is_valid_email = /^[\w.+-]+@([\w-]+\.)+[\w-]{2,8}$/u.test(email)

		if (!is_valid_email) {
			return fail(HTTP_STATUS.BAD_REQUEST, {
				errors: { email: 'Please enter a valid email address' },
				email,
			})
		}

		const { error } = await supabase.auth.signInWithOtp({ email })

		if (error !== null) {
			return fail(HTTP_STATUS.BAD_REQUEST, {
				success: false,
				email,
				message: error.message,
				// message: `There was an issue, Please contact support.`,
			})
		}

		return {
			success: true,
			message: 'Please check your email for a magic link to log into the website.',
		}
	},
}
