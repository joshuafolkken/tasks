<script lang="ts">
	import CenteredPageLayout from '$lib/components/CenteredPageLayout.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import { page_title } from '$lib/page-title'
	import type { Snippet } from 'svelte'

	interface Props {
		/** ブラウザタブ用タイトル（サブタイトルまたはアプリ名）。内部で page_title.title により整形される。 */
		title: string
		page_title: string
		description: string
		children: Snippet
	}

	const { title, page_title: header_title, description, children }: Props = $props()
</script>

<svelte:head>
	<title>{page_title.title(title)}</title>
</svelte:head>

<CenteredPageLayout>
	<PageHeader title={header_title} {description} />
	{@render children()}
</CenteredPageLayout>
