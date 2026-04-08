import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dash_display } from './dash-display'

describe('dash_display.label_color', () => {
	it('is stable for the same label name', () => {
		expect(dash_display.label_color('work')).toBe(dash_display.label_color('work'))
	})

	it('returns a tailwind-like class string', () => {
		const color_class = dash_display.label_color('x')

		expect(color_class).toMatch(/^bg-/u)
	})
})

describe('dash_display.label_chip_filter_class', () => {
	const RING_INSET = 'ring-inset'

	it('uses inactive gray styling when not selected', () => {
		const class_name = dash_display.label_chip_filter_class('work', false)

		expect(class_name).toContain('bg-gray-100')
		expect(class_name).toContain('ring-1')
		expect(class_name).toContain(RING_INSET)
		expect(class_name).toContain('ring-transparent')
	})

	it('uses label color and ring when selected', () => {
		const class_name = dash_display.label_chip_filter_class('work', true)

		expect(class_name).toContain('ring-1')
		expect(class_name).toContain(RING_INSET)
		expect(class_name).toContain('ring-current')
		expect(class_name).toContain('outline')
		expect(class_name).toMatch(/bg-/u)
	})
})

describe('dash_display.format_completed_at', () => {
	it('formats with the given locale', () => {
		const text = dash_display.format_completed_at('2026-04-04T15:30:00.000Z', 'en-US')

		expect(text).toMatch(/Apr/u)
		expect(text).toMatch(/2026/u)
	})

	it('differs by locale for the same instant', () => {
		const iso = '2026-06-15T08:00:00.000Z'
		const en = dash_display.format_completed_at(iso, 'en-US')
		const ja = dash_display.format_completed_at(iso, 'ja')

		expect(en).not.toBe(ja)
	})
})

describe('dash_display.format_due', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(Date.UTC(2026, 3, 4, 12, 0, 0)))
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('returns relative text shape for a date string', () => {
		const formatted = dash_display.format_due('2030-01-01')

		expect(formatted).toBeDefined()
		if (!formatted) return
		expect(formatted.is_overdue).toBe(false)
		expect(typeof formatted.text).toBe('string')
		expect(formatted.text.length).toBeGreaterThan(0)
	})

	it('returns undefined for empty due_date', () => {
		expect(dash_display.format_due('')).toBeUndefined()
	})

	it('marks past dates as overdue', () => {
		const formatted = dash_display.format_due('2020-01-01')

		expect(formatted?.is_overdue).toBe(true)
	})
})
