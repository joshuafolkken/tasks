<script lang="ts">
	import AuthNavButton from '$lib/components/AuthNavButton.svelte'
	import CenteredPageWithHeader from '$lib/components/CenteredPageWithHeader.svelte'
	import { common_app_title, home_description, home_migration_note } from '$lib/paraglide/messages'
	import type { PageProps } from './$types'

	const { data }: PageProps = $props()

	const app_title = $derived(common_app_title())
</script>

<CenteredPageWithHeader
	title={app_title}
	page_title={app_title}
	description={home_description({ app_title })}
>
	<div class="space-y-4">
		<p class="text-gray-600 dark:text-gray-400">
			{home_migration_note()}
		</p>
		<AuthNavButton is_logged_in={data.is_logged_in} />
	</div>
</CenteredPageWithHeader>
