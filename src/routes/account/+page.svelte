<script lang="ts">
	import { goto } from '$app/navigation'
	import { resolve } from '$app/paths'
	import { authClient } from '$lib/auth-client'
	import Card from '$lib/components/Card.svelte'
	import CenteredPageLayout from '$lib/components/CenteredPageLayout.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import {
		account_email,
		account_full_name,
		account_loading,
		account_profile,
		account_sign_out,
		account_title,
		account_update_description,
	} from '$lib/paraglide/messages'
	import { ROUTES } from '$lib/routes'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
	const { auth_user } = $derived(data)

	let is_signing_out = $state(false)

	async function handle_sign_out(): Promise<void> {
		is_signing_out = true

		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					await goto(resolve(ROUTES.AUTH_LOGIN))
				},
			},
		})

		is_signing_out = false
	}
</script>

<svelte:head>
	<title>{account_title()}</title>
</svelte:head>

<CenteredPageLayout>
	<PageHeader title={account_profile()} description={account_update_description()} />

	<Card class="space-y-6">
		<div class="space-y-4">
			<FormInput id="email" label={account_email()} value={auth_user.email} is_disabled />

			<FormInput id="name" label={account_full_name()} value={auth_user.name} is_disabled />
		</div>

		<div class="border-t border-gray-100 dark:border-gray-700"></div>

		<button
			type="button"
			disabled={is_signing_out}
			class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
			onclick={async () => {
				await handle_sign_out()
			}}
		>
			{#if is_signing_out}
				<span>{account_loading()}</span>
			{:else}
				<span>{account_sign_out()}</span>
			{/if}
		</button>
	</Card>
</CenteredPageLayout>
