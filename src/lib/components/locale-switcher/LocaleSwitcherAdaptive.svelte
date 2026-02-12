<script lang="ts">
	import { page } from '$app/state'
	import { click_outside } from '$lib/actions/click-outside'
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte'
	import { locale_names } from '$lib/components/locale-switcher/locale-names'
	import Spinner from '$lib/components/Spinner.svelte'
	import { i18n } from '$lib/i18n'
	import { locales, setLocale } from '$lib/paraglide/runtime'

	type Locale = (typeof locales)[number]
	const THRESHOLD = 3

	let switching_locale = $state<string | undefined>()
	let is_open = $state(false)

	const should_use_dropdown = $derived((locales as ReadonlyArray<string>).length >= THRESHOLD)
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

<div class="relative" use:click_outside={handle_outclick}>
	{#if should_use_dropdown}
		<button
			onclick={() => {
				if (switching_locale) return
				is_open = !is_open
			}}
			disabled={switching_locale !== undefined}
			class="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/40 px-3 py-1.5 text-xs font-bold tracking-wider uppercase shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 disabled:cursor-wait dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
			aria-expanded={is_open}
		>
			{#if switching_locale}
				<Spinner size="sm" variant="gray" />
			{:else}
				<span class="flex items-center gap-1.5">
					<span aria-hidden="true">{locale_names.get_locale_flag(current_locale)}</span>
					{locale_names.get_locale_display_name(current_locale)}
				</span>
				<ChevronDownIcon class="size-3" is_rotated={is_open} />
			{/if}
		</button>

		{#if is_open}
			<ul
				class="absolute right-0 bottom-full mb-0.5 flex min-w-full flex-col rounded-lg border border-white/20 bg-white/90 py-1 shadow-lg backdrop-blur-md dark:border-gray-700/30 dark:bg-gray-800/90"
				role="listbox"
			>
				{#each locales as locale (locale)}
					{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
					<li role="option" aria-selected={is_active}>
						<button
							onclick={async () => {
								await handle_select(locale)
							}}
							class="w-full px-3 py-1.5 text-left text-xs font-bold tracking-wider uppercase transition-colors {is_active
								? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}"
						>
							<span class="flex items-center gap-1.5">
								<span aria-hidden="true">{locale_names.get_locale_flag(locale)}</span>
								{locale_names.get_locale_display_name(locale)}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{:else}
		<div
			class="flex items-center gap-1 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
		>
			{#each locales as locale (locale)}
				{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
				{@const is_switching = switching_locale === locale}
				<button
					onclick={async () => {
						await handle_select(locale)
					}}
					disabled={switching_locale !== undefined}
					class="rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all disabled:cursor-wait {is_active
						? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
						: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
				>
					{#if is_switching}
						<Spinner size="sm" variant="gray" />
					{:else}
						<span class="flex items-center gap-1.5">
							<span aria-hidden="true">{locale_names.get_locale_flag(locale)}</span>
							{locale_names.get_locale_display_name(locale)}
						</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
