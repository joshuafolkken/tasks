import { describe, expect, it, vi } from 'vitest'
import { i18n } from './i18n'

vi.mock('$lib/paraglide/runtime', () => ({
	getLocale: (): string => 'ja',
	locales: ['en', 'ja', 'km', 'uz'] as const,
	localizeUrl: (input: URL, options: { locale: string }): URL => {
		const next = new URL(input.href)

		next.pathname = `/${options.locale}${input.pathname}`

		return next
	},
}))

describe('i18n.path', () => {
	it('keeps query string when localizing', () => {
		expect(i18n.path('/dash?done=1')).toBe('/ja/dash?done=1')
	})

	it('localizes path without search', () => {
		expect(i18n.path('/dash')).toBe('/ja/dash')
	})
})
