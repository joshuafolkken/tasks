import { browser } from '$app/environment'

type Theme = 'light' | 'dark' | 'system'
type EffectiveTheme = 'light' | 'dark'

class ThemeStore {
	readonly #storage_key = 'theme'
	readonly #media_query = '(prefers-color-scheme: dark)'
	#theme = $state<Theme>('system')
	readonly #effective_theme = $derived(this.#derive_effective_theme())

	constructor() {
		if (browser) {
			this.#theme = this.#get_stored_theme() ?? 'system'
			this.#apply_theme()
		}
	}

	#derive_effective_theme(): EffectiveTheme {
		if (this.#theme !== 'system') return this.#theme
		if (!browser) return 'light'

		return globalThis.window.matchMedia(this.#media_query).matches ? 'dark' : 'light'
	}

	get current(): Theme {
		return this.#theme
	}

	set current(value: Theme) {
		this.#theme = value

		if (browser) {
			if (value === 'system') {
				globalThis.localStorage.removeItem(this.#storage_key)
			} else {
				globalThis.localStorage.setItem(this.#storage_key, value)
			}

			this.#apply_theme()
		}
	}

	get effective(): EffectiveTheme {
		return this.#effective_theme
	}

	#get_stored_theme(): Theme | undefined {
		if (!browser) return undefined

		const stored = globalThis.localStorage.getItem(this.#storage_key)

		if (stored === null) return undefined

		return stored as Theme
	}

	#apply_theme(): void {
		if (!browser) return

		globalThis.document.documentElement.classList.toggle('dark', this.effective === 'dark')
	}

	init(): () => void {
		if (!browser) {
			return (): void => {
				// No-op on server
			}
		}

		const mq = globalThis.window.matchMedia(this.#media_query)
		const handler = this.#handle_media_change.bind(this)

		mq.addEventListener('change', handler)
		this.#apply_theme()

		return (): void => {
			mq.removeEventListener('change', handler)
		}
	}

	#handle_media_change(): void {
		if (this.#theme === 'system') {
			this.#apply_theme()
		}
	}
}

const theme_store = new ThemeStore()

export { theme_store }
export type { Theme }
