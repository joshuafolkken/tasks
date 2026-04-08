import { auth_locals } from '$lib/auth/locals'
import { redirect } from '$lib/redirect'
import { ROUTES } from '$lib/routes'
import type { PageServerLoad } from './$types'

const load: PageServerLoad = ({ locals, request }) => {
	if (auth_locals.is_fully_authenticated(locals)) {
		redirect.to_route(ROUTES.HOME, request)
	}
}

export { load }
