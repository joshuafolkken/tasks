<script lang="ts">
	import { page } from '$app/state'
	import { click_outside } from '$lib/actions/click-outside'
	import LanguageIcon from '$lib/components/icons/LanguageIcon.svelte'
	import { locale_names } from '$lib/components/locale-switcher/locale-names'
	import Spinner from '$lib/components/Spinner.svelte'
	import { i18n } from '$lib/i18n'
	import { locales, setLocale } from '$lib/paraglide/runtime'

	type Locale = (typeof locales)[number]

	let switching_locale = $state<string | undefined>()
	let is_open = $state(false)

	async function handle_select(locale: Locale): Promise<void> {
		if (switching_locale) return
		is_open = false
		switching_locale = locale
		await setLocale(locale)
		// eslint-disable-next-line require-atomic-updates -- loading state reset after async
		switching_locale = undefined
	}

	function handle_click(): void {
		if (switching_locale) return
		is_open = !is_open
	}

	function handle_outclick(): void {
		is_open = false
	}
</script>

<div class="relative" use:click_outside={handle_outclick}>
	<button
		onclick={handle_click}
		disabled={switching_locale !== undefined}
		class="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 disabled:cursor-wait dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
		aria-expanded={is_open}
		aria-label="Switch language"
	>
		{#if switching_locale}
			<Spinner size="sm" variant="gray" />
		{:else}
			<LanguageIcon class="size-4 text-gray-700 dark:text-gray-300" />
		{/if}
	</button>

	{#if is_open}
		<div
			class="absolute right-0 bottom-full z-50 mb-0.5 min-w-32 rounded-lg border border-white/20 bg-white/95 p-1 shadow-xl backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/95"
			role="menu"
		>
			{#each locales as locale (locale)}
				{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
				<button
					onclick={async () => {
						await handle_select(locale)
					}}
					role="menuitem"
					class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors {is_active
						? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
						: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}"
				>
					<span class="flex items-center gap-2 font-bold">
						<span aria-hidden="true">{locale_names.get_locale_flag(locale)}</span>
						{locale_names.get_locale_display_name(locale)}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
