<script lang="ts">
	import { click_outside } from '$lib/actions/click-outside'
	import ThemeIcon from '$lib/components/icons/ThemeIcon.svelte'
	import { theme_store, type Theme } from '$lib/stores/theme'
	import { onMount } from 'svelte'

	let theme = $state<Theme>(theme_store.get_theme())
	let is_open = $state(false)

	onMount(() => {
		theme = theme_store.get_theme()

		return theme_store.init_theme()
	})

	const THEME_OPTIONS: Array<{ value: Theme; label: string; aria_label: string }> = [
		{ value: 'light', label: 'Light', aria_label: 'Light mode' },
		{ value: 'dark', label: 'Dark', aria_label: 'Dark mode' },
		{ value: 'system', label: 'System', aria_label: 'System preference' },
	]

	function handle_theme_click(value: Theme): void {
		theme = value
		theme_store.set_theme(value)
		is_open = false
	}

	function handle_click(): void {
		is_open = !is_open
	}

	function handle_outclick(): void {
		is_open = false
	}
</script>

<div class="relative" use:click_outside={handle_outclick}>
	<button
		type="button"
		onclick={handle_click}
		class="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
		aria-expanded={is_open}
		aria-label="Switch theme"
	>
		<ThemeIcon {theme} class="size-4 text-gray-700 dark:text-gray-300" />
	</button>

	{#if is_open}
		<div
			class="absolute top-full right-0 z-50 mt-0.5 min-w-32 rounded-lg border border-white/20 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/95"
			role="menu"
		>
			{#each THEME_OPTIONS as opt (opt.value)}
				<button
					type="button"
					onclick={() => {
						handle_theme_click(opt.value)
					}}
					role="menuitem"
					aria-label={opt.aria_label}
					class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors {theme ===
					opt.value
						? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}"
				>
					<ThemeIcon theme={opt.value} class="size-4 shrink-0" />
					<span class="font-bold">{opt.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
