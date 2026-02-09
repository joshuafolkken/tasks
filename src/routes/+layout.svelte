<script lang="ts">
	import { page } from '$app/state'
	import { i18n } from '$lib/i18n'
	import { locales, localizeHref } from '$lib/paraglide/runtime'
	import './layout.css'
	import { invalidate } from '$app/navigation'
	import favicon from '$lib/assets/favicon.svg'
	import { onMount } from 'svelte'

	let { data, children } = $props()
	let { supabase, session } = $derived(data)

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_event, _session) => {
			if (_session?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth')
			}
		})

		return () => data.subscription.unsubscribe()
	})
</script>

<svelte:head>
	<title>User Management</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="mx-auto prose p-6">
	{@render children()}
</div>

<footer class="fixed right-6 bottom-6 z-50">
	<div
		class="flex items-center gap-1 rounded-full border border-white/20 bg-white/40 p-1.5 shadow-lg ring-1 ring-gray-900/5 backdrop-blur-md transition-all hover:bg-white/60"
	>
		{#each locales as locale}
			{@const active = i18n.is_locale_active(page.url.pathname, locale, locales)}
			<!-- Reload on locale change so Paraglide runtime picks up the new locale -->
			<a
				href={localizeHref(page.url.pathname, { locale })}
				data-sveltekit-reload
				class="rounded-full px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all {active
					? 'bg-white text-gray-900 shadow-sm'
					: 'text-gray-500 hover:text-gray-900'}"
			>
				{locale}
			</a>
		{/each}
	</div>
</footer>
