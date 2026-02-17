<script lang="ts">
	import { click_outside } from '$lib/actions/click-outside'
	import type { Snippet } from 'svelte'
	import { fly } from 'svelte/transition'

	interface Props {
		/** Snippet for the trigger button content */
		trigger: Snippet
		/** Snippet for the dropdown menu content. Receives a 'close' function. */
		menu: Snippet<[() => void]>
		/** Accessibility label for the trigger button */
		aria_label: string
		/** Whether the switcher is in a loading/switching state */
		is_disabled?: boolean
		/** Custom CSS classes for the root element */
		class?: string
	}

	const { trigger, menu, aria_label, is_disabled = false, class: class_name = '' }: Props = $props()
	let is_open = $state(false)

	function handle_click(): void {
		if (is_disabled) return
		is_open = !is_open
	}

	function handle_outclick(): void {
		is_open = false
	}

	function close_menu(): void {
		is_open = false
	}
</script>

<div class="relative {class_name}" use:click_outside={handle_outclick}>
	<button
		type="button"
		onclick={handle_click}
		disabled={is_disabled}
		class="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 disabled:cursor-wait dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
		aria-expanded={is_open}
		aria-label={aria_label}
	>
		{@render trigger()}
	</button>

	{#if is_open}
		<div
			transition:fly={{ y: 4, duration: 150 }}
			class="absolute top-full right-0 z-50 mt-0.5 min-w-32 rounded-lg border border-white/20 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/95"
			role="menu"
		>
			{@render menu(close_menu)}
		</div>
	{/if}
</div>
