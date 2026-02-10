import GitHubIcon from '$lib/components/icons/GitHubIcon.svelte'
import GoogleIcon from '$lib/components/icons/GoogleIcon.svelte'
import type { Component } from 'svelte'

export interface LoginProvider {
	id: 'google' | 'github'
	name: string
	action: string
	variant: 'white' | 'dark'
	icon: Component
}

export const LOGIN_PROVIDERS: Array<LoginProvider> = [
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
