<script lang="ts">
	import type { Component } from 'svelte'

	interface Props {
		icon_component: Component
	}

	const { icon_component }: Props = $props()

	// Svelte requires PascalCase tag for dynamic component
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const Icon = $derived(icon_component)
</script>

<Icon />
