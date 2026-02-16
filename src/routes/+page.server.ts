import type { PageServerLoad } from './$types'

export const load: PageServerLoad = ({ locals }: { locals: App.Locals }) => {
	return {
		is_logged_in: Boolean(locals.session && locals.user),
	}
}
