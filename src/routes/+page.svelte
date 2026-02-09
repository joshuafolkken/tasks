<script lang="ts">
	import { enhance } from '$app/forms'
	import type { SubmitFunction } from './$types'

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
			<h1 class="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
			<p class="mt-2 text-sm text-gray-600">Please sign in to your account</p>
		</div>

		<div class="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5">
			<form method="POST" action="?/signInWithGoogle" use:enhance={handle_submit}>
				<button
					type="submit"
					disabled={is_loading}
					class="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if is_loading}
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
						></div>
						<span>Connecting...</span>
					{:else}
						<svg class="h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							></path>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							></path>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
							></path>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							></path>
						</svg>
						<span>Sign in with Google</span>
					{/if}
				</button>
			</form>

			<div class="mt-6">
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-white px-2 text-gray-400">Secure Authentication</span>
					</div>
				</div>
			</div>
		</div>

		<p class="text-center text-xs text-gray-500">
			By continuing, you agree to our Terms of Service and Privacy Policy.
		</p>
	</div>
</main>
