const LOCALE_NAMES: Record<string, string> = {
	en: 'English',
	ja: '日本語',
	km: 'ភាសាខ្មែរ',
	uz: 'Oʻzbekcha',
}

const LOCALE_FLAGS: Record<string, string> = {
	en: '🇺🇸',
	ja: '🇯🇵',
	km: '🇰🇭',
	uz: '🇺🇿',
}

function get_locale_display_name(locale: string): string {
	return LOCALE_NAMES[locale] ?? locale
}

function get_locale_flag(locale: string): string {
	return LOCALE_FLAGS[locale] ?? ''
}

export const locale_names = { get_locale_display_name, get_locale_flag }
