import { auth_locals } from '$lib/auth/locals'
import { redirect } from '$lib/redirect'
import { ROUTES } from '$lib/routes'
import type { PageServerLoad } from './$types'

const load: PageServerLoad = ({ locals }) => {
	if (!auth_locals.is_fully_authenticated(locals)) {
		redirect.to_route(ROUTES.LOGIN)
	}

	return {
		auth_user: locals.user,
	}
}

export { load }
