<script lang="ts">
	import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte'
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte'
	import './layout.css'
	import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
	import { invalidate } from '$app/navigation'
	import { APP_STATE } from '$lib/AppState.svelte'
	import favicon from '$lib/assets/favicon.svg'
	import { SUPABASE_AUTH_DEPENDENCY } from '$lib/config/constants'
	import { onMount } from 'svelte'

	let { data, children } = $props()
	let { supabase, session } = $derived(data)

	function handle_auth_change(_event: AuthChangeEvent, _session: Session | null) {
		if (_session?.expires_at !== session?.expires_at) {
			invalidate(SUPABASE_AUTH_DEPENDENCY)
		}
	}

	onMount(() => {
		const { data: auth_listener } = supabase.auth.onAuthStateChange(handle_auth_change)

		return () => auth_listener.subscription.unsubscribe()
	})
</script>

<svelte:head>
	<title>User Management</title>
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
