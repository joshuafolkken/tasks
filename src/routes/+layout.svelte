<script lang="ts">
	import LocaleSwitcher from '$lib/components/LocaleSwitcher.svelte'
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

<LocaleSwitcher />
