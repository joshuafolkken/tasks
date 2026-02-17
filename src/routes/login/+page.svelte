<script lang="ts">
	import { authClient } from '$lib/auth-client'
	import Card from '$lib/components/Card.svelte'
	import CenteredPageWithHeader from '$lib/components/CenteredPageWithHeader.svelte'
	import DividerWithLabel from '$lib/components/DividerWithLabel.svelte'
	import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte'
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte'
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import SocialProviderIcon from '$lib/components/SocialProviderIcon.svelte'
	import { i18n } from '$lib/locale/i18n'
	import {
		login_connecting,
		login_please_sign_in,
		login_secure_authentication,
		login_sign_in_with,
		login_terms_privacy,
		login_title,
		login_welcome_back,
	} from '$lib/paraglide/messages'
	import { POST_AUTH_REDIRECT } from '$lib/routes'
	import type { Component } from 'svelte'

	interface SocialProvider {
		id: 'google' | 'github'
		label: string
		variant: 'social-white' | 'social-dark'
		icon_component: Component
	}

	const social_providers = $derived<Array<SocialProvider>>([
		{
			id: 'google',
			label: login_sign_in_with({ provider: 'Google' }),
			variant: 'social-white',
			icon_component: GoogleIcon,
		},
		{
			id: 'github',
			label: login_sign_in_with({ provider: 'GitHub' }),
			variant: 'social-dark',
			icon_component: GitHubIcon,
		},
	])

	let loading_provider = $state<string | undefined>()
	const is_disabled = $derived(loading_provider !== undefined)

	/* Paraglide-generated message types; IDE reports unsafe-call/assignment here. */

	const page_title_text = $derived(login_title())
	const page_header_title = $derived(login_welcome_back())
	const page_description = $derived(login_please_sign_in())

	async function handle_sign_in(provider: 'google' | 'github'): Promise<void> {
		loading_provider = provider

		await authClient.signIn.social({
			provider,
			callbackURL: i18n.path(POST_AUTH_REDIRECT),
		})
	}
</script>

<CenteredPageWithHeader
	title={page_title_text}
	page_title={page_header_title}
	description={page_description}
>
	<Card class="space-y-8">
		<div class="space-y-4">
			{#each social_providers as { id, label, variant, icon_component } (id)}
				<LoadingButton
					{label}
					loading_label={login_connecting()}
					is_loading={loading_provider === id}
					{is_disabled}
					{variant}
					on_click={async () => {
						await handle_sign_in(id)
					}}
				>
					{#snippet icon()}
						<SocialProviderIcon {icon_component} />
					{/snippet}
				</LoadingButton>
			{/each}
		</div>

		<DividerWithLabel label={login_secure_authentication()} />
	</Card>

	<p class="text-center text-xs text-gray-500 dark:text-gray-400">
		{login_terms_privacy()}
	</p>
</CenteredPageWithHeader>
