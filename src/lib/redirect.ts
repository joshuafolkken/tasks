import { redirect as svelte_redirect } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { extractLocaleFromRequest, localizeUrl } from '$lib/paraglide/runtime'

const url_base_for_localize = 'https://localhost'

/**
 * Redirects using locale derived from the request (Paraglide `getLocale()` relies on ALS, which is not always available here).
 */
function to_route(route: string, request: Request): never {
	const locale = extractLocaleFromRequest(request)
	const { pathname } = localizeUrl(new URL(route, url_base_for_localize), { locale })

	svelte_redirect(HTTP_STATUS.SEE_OTHER, pathname)
}

const redirect = { to_route }

export { redirect }
