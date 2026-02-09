/**
 * Returns a same-origin path for redirect, or the default path.
 * Use to prevent open redirects: only paths starting with "/" (and not "//") are allowed.
 */
function safe_redirect_path(next: string | null, default_path: string): string {
	if (!next || !next.startsWith('/') || next.startsWith('//')) {
		return default_path
	}

	return next
}

export const url_utilities = { safe_redirect_path }
