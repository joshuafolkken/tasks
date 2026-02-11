<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
	import Card from '$lib/components/Card.svelte'
	import CenteredPageLayout from '$lib/components/CenteredPageLayout.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import SubmitButton from '$lib/components/SubmitButton.svelte'
	import {
		account_email,
		account_full_name,
		account_loading,
		account_profile,
		account_sign_out,
		account_title,
		account_update_description,
		account_update_profile,
		account_username,
		account_website,
	} from '$lib/paraglide/messages'
	import type { PageProps } from './$types'

	const { data, form }: PageProps = $props()
	const { session, profile } = $derived(data)

	type FormAction = 'update' | 'signout'
	let loading_action = $state<FormAction | undefined>()
	const is_disabled = $derived(loading_action !== undefined)
	const full_name = $derived(profile?.full_name ?? '')
	const username = $derived(profile?.username ?? '')
	const website = $derived(profile?.website ?? '')

	const full_name_value = $derived(form?.full_name ?? full_name)
	const username_value = $derived(form?.username ?? username)
	const website_value = $derived(form?.website ?? website)

	const handle_submit = (action: FormAction): SubmitFunction => {
		return () => {
			loading_action = action

			return async ({ update }) => {
				await update({ reset: false })

				if (loading_action === action) {
					loading_action = undefined
				}
			}
		}
	}
</script>

<svelte:head>
	<title>{account_title()}</title>
</svelte:head>

<CenteredPageLayout>
	<PageHeader title={account_profile()} description={account_update_description()} />

	<Card class="space-y-6">
		<form class="space-y-4" method="post" action="?/update" use:enhance={handle_submit('update')}>
			<FormInput id="email" label={account_email()} value={session.user.email} is_disabled />

			<FormInput
				id="full_name"
				label={account_full_name()}
				name="full_name"
				value={full_name_value}
				{is_disabled}
			/>

			<FormInput
				id="username"
				label={account_username()}
				name="username"
				value={username_value}
				{is_disabled}
			/>

			<FormInput
				id="website"
				label={account_website()}
				name="website"
				value={website_value}
				{is_disabled}
			/>

			<div class="pt-2">
				<SubmitButton
					label={account_update_profile()}
					loading_label={account_loading()}
					is_loading={loading_action === 'update'}
					{is_disabled}
					variant="primary"
				/>
			</div>
		</form>

		<div class="border-t border-gray-100"></div>

		<form method="post" action="?/signout" use:enhance={handle_submit('signout')}>
			<SubmitButton
				label={account_sign_out()}
				loading_label={account_loading()}
				is_loading={loading_action === 'signout'}
				{is_disabled}
				variant="outline"
			/>
		</form>
	</Card>
</CenteredPageLayout>
