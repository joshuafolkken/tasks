import { goto as svelte_goto } from '$app/navigation'
import { page } from '$app/state'
import { getLocale, locales, localizeUrl, setLocale } from '$lib/paraglide/runtime'

/** 相対 path を URL にするためのベース（pathname 結果には影響しない） */
const URL_BASE = 'https://localhost'

type Locale = (typeof locales)[number]

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
 * Returns whether the given locale is active.
 * Use in client (e.g. layout) for locale switcher active state.
 */
function is_locale_active(
	_pathname: string,
	locale: string,
	_all_locales: ReadonlyArray<string>,
): boolean {
	return locale === getLocale()
}

/**
 * language switch with client-side navigation
 */
async function switch_locale(new_locale: Locale): Promise<void> {
	// cookie updates etc, but no reload
	await setLocale(new_locale, { reload: false })

	// localized URL for new locale
	const new_url = localizeUrl(new URL(page.url), { locale: new_locale })

	// client-side navigation
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- client-side navigation
	await svelte_goto(new_url.pathname + new_url.search + new_url.hash)
}

export const i18n = {
	path,
	goto,
	switch_locale,
	is_locale_active,
	locales,
}
