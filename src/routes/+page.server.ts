import { auth_locals } from '$lib/auth/locals'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }) => {
	return {
		is_logged_in: auth_locals.is_fully_authenticated(locals),
	}
}
