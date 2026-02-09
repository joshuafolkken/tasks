<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
	import { login_connecting, login_sign_in_with } from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Form action URL (e.g. <code>?/signInWithGoogle</code>). */
		action: string
		provider_name: string
		is_loading?: boolean
		handle_submit: SubmitFunction
		icon: Snippet
		variant?: 'white' | 'dark'
	}

	const {
		action,
		provider_name,
		is_loading = false,
		handle_submit,
		icon,
		variant = 'white',
	}: Props = $props()

	const variants = {
		white: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
		dark: 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800',
	} as const
</script>

<form method="POST" {action} use:enhance={handle_submit}>
	<button
		type="submit"
		disabled={is_loading}
		class="group relative flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 {variants[
			variant
		]}"
	>
		{#if is_loading}
			<div
				class="h-5 w-5 animate-spin rounded-full border-2 {variant === 'white'
					? 'border-gray-300 border-t-blue-600'
					: 'border-gray-600 border-t-white'}"
			></div>
			<span>{login_connecting()}</span>
		{:else}
			{@render icon()}
			<span>{login_sign_in_with({ provider: provider_name })}</span>
		{/if}
	</button>
</form>
