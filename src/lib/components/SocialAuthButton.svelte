<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
	import SubmitButton from '$lib/components/SubmitButton.svelte'
	import { login_connecting, login_sign_in_with } from '$lib/paraglide/messages'
	import type { Snippet } from 'svelte'

	interface Props {
		/** Form action URL (e.g. <code>?/signInWithGoogle</code>). */
		action: string
		provider_name: string
		is_loading?: boolean
		is_disabled?: boolean
		handle_submit: SubmitFunction
		icon: Snippet
		variant?: 'white' | 'dark'
	}

	const {
		action,
		provider_name,
		is_loading = false,
		is_disabled = false,
		handle_submit,
		icon,
		variant = 'white',
	}: Props = $props()

	const submit_button_variant = $derived(variant === 'white' ? 'social-white' : 'social-dark')
</script>

<form method="POST" {action} use:enhance={handle_submit}>
	<SubmitButton
		label={login_sign_in_with({ provider: provider_name })}
		{icon}
		loading_label={login_connecting()}
		{is_loading}
		{is_disabled}
		variant={submit_button_variant}
	/>
</form>
