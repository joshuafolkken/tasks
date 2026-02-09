<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
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
	const full_name = $derived(profile?.full_name ?? '') as string
	const username = $derived(profile?.username ?? '') as string
	const website = $derived(profile?.website ?? '') as string

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

<div class="flex flex-col items-center justify-center py-10">
	<div class="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
		<h1 class="mb-2 text-center text-2xl font-bold text-gray-900">{account_profile()}</h1>
		<p class="mb-8 text-center text-gray-600">{account_update_description()}</p>

		<form class="space-y-4" method="post" action="?/update" use:enhance={handle_form_submit}>
			<div>
				<label for="email" class="mb-1 block text-sm font-medium text-gray-700">
					{account_email()}
				</label>
				<input
					id="email"
					type="text"
					value={session.user.email}
					disabled
					class="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-500"
				/>
			</div>

			<div>
				<label for="full_name" class="mb-1 block text-sm font-medium text-gray-700">
					{account_full_name()}
				</label>
				<input
					id="full_name"
					name="full_name"
					type="text"
					value={form?.full_name ?? full_name}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="username" class="mb-1 block text-sm font-medium text-gray-700">
					{account_username()}
				</label>
				<input
					id="username"
					name="username"
					type="text"
					value={form?.username ?? username}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div>
				<label for="website" class="mb-1 block text-sm font-medium text-gray-700">
					{account_website()}
				</label>
				<input
					id="website"
					name="website"
					type="text"
					value={form?.website ?? website}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

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

		<div class="my-6 border-t border-gray-100"></div>

		<form method="post" action="?/signout" use:enhance={handle_form_submit}>
			<button
				class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
				type="submit"
				disabled={is_loading}
			>
				{account_sign_out()}
			</button>
		</form>
	</div>
</div>
