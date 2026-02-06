<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData, SubmitFunction } from './$types'

	interface Props {
		form: ActionData
	}

	const { form }: Props = $props()
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
	<title>User Management</title>
</svelte:head>

<form
	class="flex min-h-[50vh] flex-col items-center justify-center"
	method="POST"
	use:enhance={handle_submit}
>
	<div class="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 shadow-lg">
		<h1 class="mb-2 text-center text-2xl font-bold text-gray-900">Supabase + SvelteKit</h1>
		<p class="mb-8 text-center text-gray-600">Sign in via magic link with your email below</p>

		{#if form?.message !== undefined}
			<div
				class="mb-4 rounded-lg p-4 text-sm {form.success
					? 'bg-green-100 text-green-700'
					: 'bg-red-100 text-red-700'}"
			>
				{form.message}
			</div>
		{/if}

		<div class="mb-4">
			<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
			<input
				id="email"
				name="email"
				class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				type="email"
				placeholder="Your email"
				value={form?.email ?? ''}
			/>
		</div>

		{#if form?.errors?.email}
			<span class="mb-4 flex items-center text-sm text-red-600">
				{form.errors.email}
			</span>
		{/if}

		<div>
			<button
				class="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={is_loading}
			>
				{is_loading ? 'Loading...' : 'Send magic link'}
			</button>
		</div>
	</div>
</form>
