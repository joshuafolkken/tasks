<script lang="ts">
	import { page } from '$app/state'
	import { click_outside } from '$lib/actions/click-outside'
	import { locale_names } from '$lib/components/locale-switcher/locale-names'
	import Spinner from '$lib/components/Spinner.svelte'
	import { i18n } from '$lib/i18n'
	import { locales, setLocale } from '$lib/paraglide/runtime'

	type Locale = (typeof locales)[number]

	let switching_locale = $state<string | undefined>()
	let is_open = $state(false)

	const current_locale = $derived(
		locales.find((loc) => i18n.is_locale_active(page.url.pathname, loc, locales)) ?? locales[0],
	)

	async function handle_select(locale: Locale): Promise<void> {
		if (switching_locale) return
		is_open = false
		switching_locale = locale
		await setLocale(locale)
		// eslint-disable-next-line require-atomic-updates -- loading state reset after async
		switching_locale = undefined
	}

	function handle_outclick(): void {
		is_open = false
	}
</script>

<div class="relative inline-block" use:click_outside={handle_outclick}>
	<button
		onclick={() => {
			if (switching_locale) return
			is_open = !is_open
		}}
		disabled={switching_locale !== undefined}
		class="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-wait dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
		aria-expanded={is_open}
		aria-label="Language: {locale_names.get_locale_display_name(current_locale)}"
	>
		{#if switching_locale}
			<Spinner size="sm" variant="gray" />
		{:else}
			<span class="flex items-center gap-1.5">
				<span aria-hidden="true">{locale_names.get_locale_flag(current_locale)}</span>
				{locale_names.get_locale_display_name(current_locale)}
			</span>
			<svg class="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
				></path>
			</svg>
		{/if}
	</button>

	{#if is_open}
		<div
			class="absolute top-full right-0 z-50 mt-0.5 min-w-[6rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
			role="menu"
		>
			{#each locales as locale (locale)}
				{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
				<button
					onclick={async () => {
						await handle_select(locale)
					}}
					role="menuitem"
					class="w-full px-3 py-1.5 text-left text-xs font-medium uppercase transition-colors {is_active
						? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
						: 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'}"
				>
					<span class="flex items-center gap-1.5">
						<span aria-hidden="true">{locale_names.get_locale_flag(locale)}</span>
						{locale_names.get_locale_display_name(locale)}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
