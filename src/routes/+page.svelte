<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import FormErrorMessage from '$lib/components/FormErrorMessage.svelte'
	import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte'
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte'
	import SocialAuthButton from '$lib/components/SocialAuthButton.svelte'
	import {
		common_error_label,
		login_please_sign_in,
		login_secure_authentication,
		login_terms_privacy,
		login_welcome_back,
	} from '$lib/paraglide/messages'
	import type { Component } from 'svelte'
	import type { PageProps } from './$types'

	const LOGIN_PROVIDERS: Array<{
		id: 'google' | 'github'
		name: string
		action: string
		variant: 'white' | 'dark'
		icon: Component
	}> = [
		{
			id: 'google',
			name: 'Google',
			action: '?/signInWithGoogle',
			variant: 'white',
			icon: GoogleIcon,
		},
		{
			id: 'github',
			name: 'GitHub',
			action: '?/signInWithGitHub',
			variant: 'dark',
			icon: GitHubIcon,
		},
	]

	const { form }: PageProps = $props()
	let is_loading = $state(false)

	const handle_submit: SubmitFunction = () => {
		is_loading = true

		return async ({ update }) => {
			await update()
			is_loading = false
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

		<div class="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
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
						{is_loading}
						{handle_submit}
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
		</div>

		<p class="text-center text-xs text-gray-500">
			{login_terms_privacy()}
		</p>
	</div>
</main>
