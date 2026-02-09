import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safe_get_session }, cookies }) => {
	const { session, user } = await safe_get_session()

	return {
		session,
		user,
		cookies: cookies.getAll(),
	}
}
