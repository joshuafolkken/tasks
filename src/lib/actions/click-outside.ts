import type { Action } from 'svelte/action'

export const click_outside: Action<HTMLElement, (event: MouseEvent) => void> = (
	node,
	on_outclick,
) => {
	let current_handler = on_outclick

	function handle_click(event: MouseEvent): void {
		if (!node.contains(event.target as Node)) {
			current_handler(event)
		}
	}

	document.addEventListener('click', handle_click, true)

	return {
		update(new_handler: (event: MouseEvent) => void): void {
			current_handler = new_handler
		},
		destroy(): void {
			document.removeEventListener('click', handle_click, true)
		},
	}
}
