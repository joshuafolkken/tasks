<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
		/** `start`: top-aligned main column (e.g. dashboard). Default keeps legacy centered layout. */
		content_vertical_align?: 'center' | 'start'
	}

	const { children, content_vertical_align = 'center' }: Props = $props()

	const main_align_class = $derived(
		content_vertical_align === 'start'
			? 'items-start justify-center'
			: 'items-center justify-center',
	)

	const main_pad_class = $derived(
		content_vertical_align === 'start'
			? 'px-4 pt-8 pb-12 sm:px-6 lg:px-8'
			: 'px-4 py-12 sm:px-6 lg:px-8',
	)
</script>

<main class="flex min-h-screen {main_align_class} {main_pad_class}">
	<div class="w-full max-w-md space-y-8">
		{@render children()}
	</div>
</main>
