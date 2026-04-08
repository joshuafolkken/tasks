/** Subset of `KeyboardEvent` used for title-field vertical navigation (arrows + Ctrl+N / Ctrl+U). */
type TitleNavKeySource = Pick<KeyboardEvent, 'ctrlKey' | 'key'>

function read_ctrl_nav_direction(key_event: TitleNavKeySource): 'up' | 'down' | undefined {
	if (!key_event.ctrlKey) return undefined
	if (key_event.key === 'u') return 'up'
	if (key_event.key === 'n') return 'down'

	return undefined
}

function read_vertical_arrow_direction(key_event: TitleNavKeySource): 'up' | 'down' | undefined {
	if (key_event.key === 'ArrowUp') return 'up'
	if (key_event.key === 'ArrowDown') return 'down'

	return read_ctrl_nav_direction(key_event)
}

const dash_inline_editor_keyboard = {
	read_ctrl_nav_direction,
	read_vertical_arrow_direction,
}

export { dash_inline_editor_keyboard }
