import { getLocale, localizeUrl } from '$lib/paraglide/runtime'
import { ROUTES } from '$lib/routes'

/**
 * Returns the localized pathname for a given path on the given origin.
 * Use in server-side code (load, actions, API routes) for redirects and links
 * so that the target URL includes the current locale prefix when applicable.
 */
function localized_path(url: URL, path: string): string {
	return localizeUrl(new URL(path, url.origin), { locale: getLocale() }).pathname
}

/**
 * Returns the localized path to the home page.
 * Use for redirects when the user is not signed in (e.g. after sign-out or from protected load).
 */
function home_path(url: URL): string {
	return localized_path(url, ROUTES.HOME)
}

/**
 * Returns whether the given locale is active for the current pathname.
 * Use in client (e.g. layout) for locale switcher active state.
 */
function is_locale_active(
	pathname: string,
	locale: string,
	all_locales: ReadonlyArray<string>,
): boolean {
	return locale === 'en'
		? !all_locales.some((other) => other !== 'en' && pathname.startsWith(`/${other}`))
		: pathname.startsWith(`/${locale}`)
}

/** i18n helpers for server and client. Prefer importing named functions when possible. */
export const i18n = { localized_path, home_path, is_locale_active }
