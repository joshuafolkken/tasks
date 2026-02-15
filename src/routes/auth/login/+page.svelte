<script lang="ts">
	import { authClient } from '$lib/auth-client'
	import Card from '$lib/components/Card.svelte'
	import CenteredPageLayout from '$lib/components/CenteredPageLayout.svelte'
	import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte'
	import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import {
		login_connecting,
		login_please_sign_in,
		login_secure_authentication,
		login_sign_in_with,
		login_terms_privacy,
		login_welcome_back,
	} from '$lib/paraglide/messages'
	import { ROUTES } from '$lib/routes'

	let loading_provider = $state<string | undefined>()
	const is_disabled = $derived(loading_provider !== undefined)

	async function handle_sign_in(provider: 'google' | 'github'): Promise<void> {
		loading_provider = provider

		await authClient.signIn.social({
			provider,
			callbackURL: ROUTES.HOME,
		})
	}

	interface SocialButton {
		id: 'google' | 'github'
		name: string
		variant: 'white' | 'dark'
	}

	const providers: Array<SocialButton> = [
		{ id: 'google', name: 'Google', variant: 'white' },
		{ id: 'github', name: 'GitHub', variant: 'dark' },
	]

	const button_base =
		'flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-50'

	const variant_classes: Record<string, string> = {
		white:
			'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
		dark: 'border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600',
	}
</script>

<svelte:head>
	<title>Sign In | Task Manager</title>
</svelte:head>

<CenteredPageLayout>
	<PageHeader title={login_welcome_back()} description={login_please_sign_in()} />

	<Card class="space-y-8">
		<div class="space-y-4">
			{#each providers as provider (provider.id)}
				<button
					type="button"
					disabled={is_disabled}
					class="{button_base} {variant_classes[provider.variant]}"
					onclick={async () => {
						await handle_sign_in(provider.id)
					}}
				>
					{#if loading_provider === provider.id}
						<Spinner size="md" variant={provider.variant === 'dark' ? 'dark' : 'blue'} />
						<span>{login_connecting()}</span>
					{:else}
						{#if provider.id === 'google'}
							<GoogleIcon />
						{:else}
							<GitHubIcon />
						{/if}
						<span>{login_sign_in_with({ provider: provider.name })}</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="mt-6">
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white px-2 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
						{login_secure_authentication()}
					</span>
				</div>
			</div>
		</div>
	</Card>

	<p class="text-center text-xs text-gray-500 dark:text-gray-400">
		{login_terms_privacy()}
	</p>
</CenteredPageLayout>
