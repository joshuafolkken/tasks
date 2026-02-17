<script lang="ts">
	import DropdownSwitcher from '$lib/components/DropdownSwitcher.svelte'
	import ThemeIcon from '$lib/theme/components/icons/ThemeIcon.svelte'
	import { theme_store, type Theme } from '$lib/theme/ThemeStore.svelte'
	import { onMount } from 'svelte'

	onMount(() => {
		return theme_store.init()
	})

	const THEME_OPTIONS: Array<{ value: Theme; label: string; aria_label: string }> = [
		{ value: 'light', label: 'Light', aria_label: 'Light mode' },
		{ value: 'dark', label: 'Dark', aria_label: 'Dark mode' },
		{ value: 'system', label: 'System', aria_label: 'System preference' },
	]

	function handle_theme_click(value: Theme): void {
		theme_store.current = value
	}
</script>

<DropdownSwitcher aria_label="Switch theme">
	{#snippet trigger()}
		<ThemeIcon theme={theme_store.current} class="size-4 text-gray-700 dark:text-gray-300" />
	{/snippet}

	{#snippet menu(close: () => void)}
		{#each THEME_OPTIONS as opt (opt.value)}
			<button
				type="button"
				onclick={() => {
					close()
					handle_theme_click(opt.value)
				}}
				role="menuitem"
				aria-label={opt.aria_label}
				class="dropdown-menu-item {theme_store.current === opt.value
					? 'dropdown-menu-item--active'
					: 'dropdown-menu-item--inactive'}"
			>
				<ThemeIcon theme={opt.value} class="size-4 shrink-0" />
				<span class="font-bold">{opt.label}</span>
			</button>
		{/each}
	{/snippet}
</DropdownSwitcher>
