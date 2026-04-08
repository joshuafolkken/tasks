import { describe, expect, it } from 'vitest'
import { dash_inline_editor_keyboard } from './dash-inline-editor-keyboard'

describe('dash_inline_editor_keyboard read_ctrl_nav_direction', () => {
	it.each([
		{ payload: { ctrlKey: true, key: 'n' }, expected: 'down' as const },
		{ payload: { ctrlKey: true, key: 'u' }, expected: 'up' as const },
	])('maps Ctrl+$payload.key to $expected', ({ payload, expected }) => {
		expect(dash_inline_editor_keyboard.read_ctrl_nav_direction(payload)).toBe(expected)
	})

	it('ignores Ctrl+N when ctrlKey is false', () => {
		expect(
			dash_inline_editor_keyboard.read_ctrl_nav_direction({ ctrlKey: false, key: 'n' }),
		).toBeUndefined()
	})
})

describe('dash_inline_editor_keyboard read_vertical_arrow_direction', () => {
	it.each([
		{ payload: { ctrlKey: false, key: 'ArrowDown' }, expected: 'down' as const },
		{ payload: { ctrlKey: false, key: 'ArrowUp' }, expected: 'up' as const },
		{ payload: { ctrlKey: true, key: 'n' }, expected: 'down' as const },
		{ payload: { ctrlKey: true, key: 'u' }, expected: 'up' as const },
	])('maps key $payload.key to $expected', ({ payload, expected }) => {
		expect(dash_inline_editor_keyboard.read_vertical_arrow_direction(payload)).toBe(expected)
	})

	it('returns undefined for unrelated keys', () => {
		expect(
			dash_inline_editor_keyboard.read_vertical_arrow_direction({ ctrlKey: true, key: 'x' }),
		).toBeUndefined()
	})
})
