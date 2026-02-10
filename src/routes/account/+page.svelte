<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
	import Card from '$lib/components/Card.svelte'
	import FormInput from '$lib/components/FormInput.svelte'
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

	let is_loading = $state(false)
	const full_name = $derived(profile?.full_name ?? '')
	const username = $derived(profile?.username ?? '')
	const website = $derived(profile?.website ?? '')

	const handle_form_submit: SubmitFunction = () => {
		is_loading = true

		return async ({ update }) => {
			await update()
			is_loading = false
		}
	}
</script>

<svelte:head>
	<title>{account_title()}</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-extrabold text-gray-900">{account_profile()}</h1>
			<p class="mt-2 text-sm text-gray-600">{account_update_description()}</p>
		</div>

		<Card class="space-y-6">
			<form class="space-y-4" method="post" action="?/update" use:enhance={handle_form_submit}>
				<FormInput id="email" label={account_email()} value={session.user.email} is_disabled />

				<FormInput
					id="full_name"
					label={account_full_name()}
					name="full_name"
					value={form?.full_name ?? full_name}
				/>

				<FormInput
					id="username"
					label={account_username()}
					name="username"
					value={form?.username ?? username}
				/>

				<FormInput
					id="website"
					label={account_website()}
					name="website"
					value={form?.website ?? website}
				/>

				<div class="pt-2">
					<button
						class="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						type="submit"
						disabled={is_loading}
					>
						{is_loading ? account_loading() : account_update_profile()}
					</button>
				</div>
			</form>

			<div class="border-t border-gray-100"></div>

			<form method="post" action="?/signout" use:enhance={handle_form_submit}>
				<button
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
					type="submit"
					disabled={is_loading}
				>
					{account_sign_out()}
				</button>
			</form>
		</Card>
	</div>
</main>
