<script lang="ts">
	import { browser } from '$app/environment'
	import { page } from '$app/state'
	import './layout.css'
	import favicon from '$lib/assets/favicon.svg'
	import LocaleSwitcher from '$lib/locale/components/LocaleSwitcher.svelte'
	import { locale_store } from '$lib/locale/LocaleStore.svelte'
	import { common_app_title } from '$lib/paraglide/messages'
	import { extractLocaleFromUrl, overwriteGetLocale } from '$lib/paraglide/runtime'
	import ThemeSwitcher from '$lib/theme/components/ThemeSwitcher.svelte'

	let { children } = $props()

	if (browser) {
		overwriteGetLocale(() => {
			// page.url is reactive, so this function will re-run when the URL changes
			return extractLocaleFromUrl(page.url) ?? 'en'
		})
	}
</script>

<svelte:head>
	<title>{common_app_title()}</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class={locale_store.is_switching ? 'cursor-wait' : ''}>
	<header class="fixed top-0 right-0 z-50 flex items-center gap-2 p-4" aria-label="App bar">
		<LocaleSwitcher />
		<ThemeSwitcher />
	</header>

	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		{@render children()}
	</div>
</div>
