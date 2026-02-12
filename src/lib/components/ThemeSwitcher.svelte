<script lang="ts">
	import { theme_store, type Theme } from '$lib/stores/theme'
	import { onMount } from 'svelte'

	let theme = $state<Theme>(theme_store.get_theme())

	onMount(() => {
		theme = theme_store.get_theme()

		return theme_store.init_theme()
	})

	const THEME_OPTIONS: Array<{ value: Theme; label: string; aria_label: string }> = [
		{ value: 'light', label: '☀', aria_label: 'Light mode' },
		{ value: 'dark', label: '🌙', aria_label: 'Dark mode' },
		{ value: 'system', label: '💻', aria_label: 'System preference' },
	]

	function handle_theme_click(value: Theme): void {
		theme = value
		theme_store.set_theme(value)
	}
</script>

<footer class="fixed top-6 right-6 z-50">
	<div
		class="flex items-center gap-1 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
	>
		{#each THEME_OPTIONS as opt (opt.value)}
			<button
				type="button"
				aria-label={opt.aria_label}
				onclick={() => {
					handle_theme_click(opt.value)
				}}
				class="rounded-full px-3 py-1.5 text-xs font-bold transition-all {theme === opt.value
					? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
					: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
			>
				{opt.label}
			</button>
		{/each}
	</div>
</footer>
