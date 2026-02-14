import { redirect } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { ROUTES } from '$lib/routes'
import type { PageServerLoad } from './$types'

const load: PageServerLoad = ({ locals }) => {
	if (!locals.session || !locals.user) {
		redirect(HTTP_STATUS.SEE_OTHER, ROUTES.AUTH_LOGIN)
	}

	return {
		auth_user: locals.user,
	}
}

export { load }
