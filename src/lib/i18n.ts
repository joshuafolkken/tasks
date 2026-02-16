import { goto as svelte_goto } from '$app/navigation'
import { getLocale, localizeUrl } from '$lib/paraglide/runtime'

/** 相対 path を URL にするためのベース（pathname 結果には影響しない） */
const URL_BASE = 'https://localhost'

/**
 * 現在のロケールでローカライズした pathname を返す。サーバー・クライアント両方で利用可。
 * リダイレクト、リンク、goto、callbackURL などにそのまま渡せる。
 */
function path(route: string): string {
	return localizeUrl(new URL(route, URL_BASE), { locale: getLocale() }).pathname
}

/**
 * 現在のロケールでローカライズした path へクライアント遷移する。
 */
function goto(route: string): void {
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- 現在ロケールでパスを生成
	void svelte_goto(path(route))
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
export const i18n = {
	path,
	goto,
	is_locale_active,
}
