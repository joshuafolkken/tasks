import { redirect as svelte_redirect } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'

/**
 * Redirects to the given route with current locale. Use in load functions.
 */
function to_route(route: string): never {
	svelte_redirect(HTTP_STATUS.SEE_OTHER, i18n.path(route))
}

const redirect = { to_route }

export { redirect }
