<script lang="ts">
	import { page } from '$app/state'
	import { click_outside } from '$lib/actions/click-outside'
	import ChevronDownIcon from '$lib/components/icons/ChevronDownIcon.svelte'
	import { locale_names } from '$lib/components/locale-switcher/locale-names'
	import Spinner from '$lib/components/Spinner.svelte'
	import { i18n } from '$lib/i18n'
	import { locales, setLocale } from '$lib/paraglide/runtime'
	import { onMount } from 'svelte'

	type Locale = (typeof locales)[number]

	let switching_locale = $state<string | undefined>()
	let is_open = $state(false)
	let is_dark = $state(false)

	onMount(() => {
		is_dark = document.documentElement.classList.contains('dark')

		const observer = new MutationObserver(() => {
			is_dark = document.documentElement.classList.contains('dark')
		})

		observer.observe(document.documentElement, {
			attributes: true,
			// eslint-disable-next-line @typescript-eslint/naming-convention -- DOM API property
			attributeFilter: ['class'],
		})

		return () => {
			observer.disconnect()
		}
	})

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

	function handle_click(): void {
		if (switching_locale) return
		is_open = !is_open
	}

	function handle_outclick(): void {
		is_open = false
	}

	function get_item_class(is_active: boolean, dark_mode: boolean): string {
		if (is_active) {
			return dark_mode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
		}

		return dark_mode
			? 'text-gray-300 hover:bg-gray-700 hover:text-white'
			: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
	}
</script>

<div class="relative" use:click_outside={handle_outclick}>
	<button
		onclick={handle_click}
		disabled={switching_locale !== undefined}
		class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold shadow-lg ring-1 backdrop-blur-md transition-all disabled:cursor-wait {is_dark
			? 'border-gray-700/30 bg-gray-800/40 text-gray-100 ring-gray-900/5 hover:bg-gray-800/60'
			: 'border-gray-200 bg-white/90 text-gray-900 ring-gray-900/5 hover:bg-white'}"
		aria-expanded={is_open}
		aria-haspopup="listbox"
	>
		{#if switching_locale}
			<Spinner size="sm" variant="gray" />
		{:else}
			<span class="flex items-center gap-1.5">
				<span aria-hidden="true">{locale_names.get_locale_flag(current_locale)}</span>
				{locale_names.get_locale_display_name(current_locale)}
			</span>
			<ChevronDownIcon class="size-3 shrink-0" is_rotated={is_open} />
		{/if}
	</button>

	{#if is_open}
		<ul
			class="absolute right-0 bottom-full mb-0.5 flex min-w-full flex-col rounded-lg border py-1 shadow-lg {is_dark
				? 'border-gray-700/30 bg-gray-800'
				: 'border-gray-200 bg-white'}"
			role="listbox"
		>
			{#each locales as locale (locale)}
				{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
				<li role="option" aria-selected={is_active}>
					<button
						onclick={async () => {
							await handle_select(locale)
						}}
						class="w-full px-3 py-1.5 text-left text-xs font-bold transition-colors {get_item_class(
							is_active,
							is_dark,
						)}"
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
</div>
