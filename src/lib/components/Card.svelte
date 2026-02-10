<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
		class?: string
	}

	const { children, class: class_name = '' }: Props = $props()
</script>

<div class="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/5 {class_name}">
	{@render children()}
</div>
