<script lang="ts">
	import { page } from '$app/state'
	import { i18n } from '$lib/i18n'
	import { locales, localizeHref } from '$lib/paraglide/runtime'
</script>

<footer class="fixed right-6 bottom-6 z-50">
	<div
		class="flex items-center gap-1 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60"
	>
		{#each locales as locale (locale)}
			{@const is_active = i18n.is_locale_active(page.url.pathname, locale, locales)}
			<!-- Reload on locale change so Paraglide runtime picks up the new locale -->
			<a
				href={localizeHref(page.url.pathname, { locale })}
				data-sveltekit-reload
				class="rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {is_active
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				{locale}
			</a>
		{/each}
	</div>
</footer>
