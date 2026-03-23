import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte'
import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte'
import type { Component } from 'svelte'

interface SocialProvider {
	id: 'google' | 'github'
	label: string
	variant: 'social-white' | 'social-dark'
	icon_component: Component
}

function list(sign_in_with: (input: { provider: string }) => string): Array<SocialProvider> {
	return [
		{
			id: 'google',
			label: sign_in_with({ provider: 'Google' }),
			variant: 'social-white',
			icon_component: GoogleIcon,
		},
		{
			id: 'github',
			label: sign_in_with({ provider: 'GitHub' }),
			variant: 'social-dark',
			icon_component: GitHubIcon,
		},
	]
}

const social_providers = {
	list,
}

export type { SocialProvider }
export { social_providers }
