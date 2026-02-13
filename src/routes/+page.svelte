<script lang="ts">
	import { resolve } from '$app/paths'
	import CenteredPageLayout from '$lib/components/CenteredPageLayout.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
</script>

<svelte:head>
	<title>Task Manager</title>
</svelte:head>

<CenteredPageLayout>
	<PageHeader title="Task Manager" description="Welcome to Task Manager" />

	<div class="space-y-4">
		<p class="text-gray-600 dark:text-gray-400">
			Authentication demos and features will be migrated to Better Auth with Cloudflare D1.
		</p>
		<ul class="space-y-2">
			<li>
				<a
					href={resolve('/demo/supabase')}
					class="text-blue-600 hover:underline dark:text-blue-400"
				>
					Supabase Auth Demo (SNS login)
				</a>
			</li>
			<li>
				<a href={resolve('/demo')} class="text-blue-600 hover:underline dark:text-blue-400">
					Other demos
				</a>
			</li>
		</ul>
	</div>
</CenteredPageLayout>
