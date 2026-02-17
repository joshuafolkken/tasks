<script lang="ts">
	import { authClient } from '$lib/auth-client'
	import Card from '$lib/components/Card.svelte'
	import CenteredPageWithHeader from '$lib/components/CenteredPageWithHeader.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import { i18n } from '$lib/locale/i18n'
	import {
		account_email,
		account_full_name,
		account_profile,
		account_sign_out,
		account_title,
		account_update_description,
		common_loading,
	} from '$lib/paraglide/messages'
	import { POST_AUTH_REDIRECT } from '$lib/routes'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()
	const { auth_user } = $derived(data)

	let is_signing_out = $state(false)

	async function handle_sign_out(): Promise<void> {
		is_signing_out = true

		try {
			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						i18n.goto(POST_AUTH_REDIRECT)
					},
				},
			})
		} finally {
			is_signing_out = false
		}
	}
</script>

<CenteredPageWithHeader
	title={account_title()}
	page_title={account_profile()}
	description={account_update_description()}
>
	<Card class="space-y-6">
		<div class="space-y-4">
			<FormInput id="email" label={account_email()} value={auth_user?.email} is_disabled />

			<FormInput id="name" label={account_full_name()} value={auth_user?.name} is_disabled />
		</div>

		<div class="border-t border-gray-100 dark:border-gray-700"></div>

		<LoadingButton
			label={account_sign_out()}
			loading_label={common_loading()}
			is_loading={is_signing_out}
			variant="outline"
			on_click={async () => {
				await handle_sign_out()
			}}
		/>
	</Card>
</CenteredPageWithHeader>
