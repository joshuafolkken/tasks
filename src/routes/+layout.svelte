<script lang="ts">
	import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte'
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte'
	import './layout.css'
	import { APP_STATE } from '$lib/AppState.svelte'
	import favicon from '$lib/assets/favicon.svg'
	import { common_app_title } from '$lib/paraglide/messages'

	let { children } = $props()
</script>

<svelte:head>
	<title>{common_app_title()}</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class={APP_STATE.is_switching_locale ? 'cursor-wait' : ''}>
	<header class="fixed top-0 right-0 z-50 flex items-center gap-2 p-4" aria-label="App bar">
		<LocaleSwitcher />
		<ThemeSwitcher />
	</header>

	<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
		{@render children()}
	</div>
</div>
