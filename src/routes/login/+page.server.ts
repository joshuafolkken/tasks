import { redirect } from '$lib/redirect'
import { ROUTES } from '$lib/routes'
import type { PageServerLoad } from './$types'

const load: PageServerLoad = ({ locals }: { locals: App.Locals }) => {
	if (locals.session) {
		redirect.to_route(ROUTES.HOME)
	}
}

export { load }
