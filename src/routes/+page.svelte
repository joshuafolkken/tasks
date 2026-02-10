<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import Card from '$lib/components/Card.svelte'
	import FormErrorMessage from '$lib/components/FormErrorMessage.svelte'
	import SocialAuthButton from '$lib/components/SocialAuthButton.svelte'
	import { LOGIN_PROVIDERS } from '$lib/config/auth-providers'
	import {
		common_error_label,
		login_please_sign_in,
		login_secure_authentication,
		login_terms_privacy,
		login_welcome_back,
	} from '$lib/paraglide/messages'
	import type { PageProps } from './$types'

	const { form }: PageProps = $props()
	let loading_provider = $state<string | undefined>()

	const create_submit_handler = (provider_id: string): SubmitFunction => {
		return () => {
			loading_provider = provider_id

			return async ({ update }) => {
				await update()

				if (loading_provider === provider_id) {
					loading_provider = undefined
				}
			}
		}
	}
</script>

<svelte:head>
	<title>Sign In | Task Manager</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-extrabold text-gray-900">{login_welcome_back()}</h1>
			<p class="mt-2 text-sm text-gray-600">{login_please_sign_in()}</p>
		</div>

		<Card class="space-y-8">
			{#if form?.message}
				<FormErrorMessage label={common_error_label()} message={form.message} />
			{/if}

			<div class="space-y-4">
				{#each LOGIN_PROVIDERS as provider (provider.id)}
					<!-- eslint-disable-next-line @typescript-eslint/naming-convention -->
					{@const Icon = provider.icon}
					<SocialAuthButton
						action={provider.action}
						provider_name={provider.name}
						is_loading={loading_provider === provider.id}
						is_disabled={loading_provider !== undefined}
						handle_submit={create_submit_handler(provider.id)}
						variant={provider.variant}
					>
						{#snippet icon()}
							<Icon />
						{/snippet}
					</SocialAuthButton>
				{/each}
			</div>

			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-white px-2 text-gray-400">{login_secure_authentication()}</span>
					</div>
				</div>
			</div>
		</Card>

		<p class="text-center text-xs text-gray-500">
			{login_terms_privacy()}
		</p>
	</div>
</main>
