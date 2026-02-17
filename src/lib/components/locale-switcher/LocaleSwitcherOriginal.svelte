<script lang="ts">
	import { page } from '$app/state'
	import Spinner from '$lib/components/Spinner.svelte'
	import { i18n } from '$lib/locale/i18n'
	import { locales } from '$lib/paraglide/runtime'

	let switching_locale = $state<string | undefined>()
</script>

<!-- Uses absolute for demo; production LocaleSwitcher uses fixed -->
<div class="absolute right-0 bottom-0">
	<div
		class="flex items-center gap-1 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60 dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
	>
		{#each locales as locale (locale)}
			{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
			{@const is_switching = switching_locale === locale}
			<button
				onclick={async () => {
					if (switching_locale) return
					switching_locale = locale
					await i18n.switch_locale(locale)
				}}
				disabled={switching_locale !== undefined}
				class="rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all disabled:cursor-wait {is_active
					? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
					: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}"
			>
				{#if is_switching}
					<Spinner size="sm" variant="gray" />
				{:else}
					{locale}
				{/if}
			</button>
		{/each}
	</div>
</div>
