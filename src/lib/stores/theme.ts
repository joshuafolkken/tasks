type Theme = 'light' | 'dark' | 'system'
type EffectiveTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'theme'
const DEFAULT_LIGHT = 'light'
const THEME_DARK = 'dark'
const THEME_SYSTEM = 'system'
const MEDIA_PREFERS_DARK = '(prefers-color-scheme: dark)'

function is_browser(): boolean {
	return 'window' in globalThis && 'localStorage' in globalThis
}

function get_system_theme(): EffectiveTheme {
	if (!is_browser()) return DEFAULT_LIGHT

	return globalThis.window.matchMedia(MEDIA_PREFERS_DARK).matches ? THEME_DARK : DEFAULT_LIGHT
}

function get_stored_theme(): Theme | undefined {
	if (!is_browser()) return undefined

	const stored = globalThis.localStorage.getItem(THEME_STORAGE_KEY)
	const valid_themes: Array<Theme> = [DEFAULT_LIGHT, THEME_DARK, THEME_SYSTEM]

	return valid_themes.includes(stored as Theme) ? (stored as Theme) : undefined
}

function get_effective_theme(): EffectiveTheme {
	const stored = get_stored_theme()

	if (stored === THEME_DARK) return THEME_DARK
	if (stored === DEFAULT_LIGHT) return DEFAULT_LIGHT

	return get_system_theme()
}

function apply_theme(theme: EffectiveTheme): void {
	document.documentElement.classList.toggle('dark', theme === THEME_DARK)
}

function set_theme(value: Theme): void {
	if (value === THEME_SYSTEM) {
		globalThis.localStorage.removeItem(THEME_STORAGE_KEY)
	} else {
		globalThis.localStorage.setItem(THEME_STORAGE_KEY, value)
	}

	apply_theme(get_effective_theme())
}

function get_theme(): Theme {
	return get_stored_theme() ?? THEME_SYSTEM
}

function init_theme(): () => void {
	const effective = get_effective_theme()

	apply_theme(effective)

	const mq = globalThis.window.matchMedia(MEDIA_PREFERS_DARK)

	function handle_change(): void {
		if (get_stored_theme() === undefined) {
			apply_theme(get_system_theme())
		}
	}

	mq.addEventListener('change', handle_change)

	return () => {
		mq.removeEventListener('change', handle_change)
	}
}

const theme_store = {
	get_theme,
	init_theme,
	set_theme,
}

export { theme_store }
export type { Theme }
