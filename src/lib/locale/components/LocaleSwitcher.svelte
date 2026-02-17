<script lang="ts">
	import { page } from '$app/state'
	import DropdownSwitcher from '$lib/components/DropdownSwitcher.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import LanguageIcon from '$lib/locale/components/LanguageIcon.svelte'
	import { i18n } from '$lib/locale/i18n'
	import { locale_names } from '$lib/locale/locale-names'
	// import { locale_store } from '$lib/locale/LocaleStore.svelte'
	import { locales } from '$lib/paraglide/runtime'

	type Locale = (typeof locales)[number]
	const switching_locale = $state<string | undefined>()

	async function handle_select(locale: Locale): Promise<void> {
		if (switching_locale) return

		if (i18n.is_locale_active(page.url.pathname, locale, locales)) return

		// switching_locale = locale
		// locale_store.is_switching = true

		await i18n.switch_locale(locale)
	}
</script>

<DropdownSwitcher aria_label="Switch language" is_disabled={switching_locale !== undefined}>
	{#snippet trigger()}
		{#if switching_locale}
			<Spinner size="sm" variant="gray" />
		{:else}
			<LanguageIcon class="size-4 text-gray-700 dark:text-gray-300" />
		{/if}
	{/snippet}

	{#snippet menu(close: () => void)}
		{#each locales as locale (locale)}
			{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
			<button
				onclick={async () => {
					close()
					await handle_select(locale)
				}}
				role="menuitem"
				class="dropdown-menu-item {is_active
					? 'dropdown-menu-item--active'
					: 'dropdown-menu-item--inactive'}"
			>
				<span class="flex items-center gap-2 font-bold">
					<span aria-hidden="true">{locale_names.get_locale_flag(locale)}</span>
					{locale_names.get_locale_display_name(locale)}
				</span>
			</button>
		{/each}
	{/snippet}
</DropdownSwitcher>
