<script lang="ts">
	import DarkIcon from '$lib/theme/components/icons/DarkIcon.svelte'
	import LightIcon from '$lib/theme/components/icons/LightIcon.svelte'
	import SystemIcon from '$lib/theme/components/icons/SystemIcon.svelte'
	import type { Theme } from '$lib/theme/ThemeStore.svelte'
	import { DEFAULT_ICON_CLASS, type IconProperties } from '$lib/types'

	interface Props extends IconProperties {
		theme: Theme
	}

	const { theme, class: class_name = DEFAULT_ICON_CLASS }: Props = $props()
</script>

{#if theme === 'light'}
	<LightIcon class={class_name} />
{:else if theme === 'dark'}
	<DarkIcon class={class_name} />
{:else}
	<SystemIcon class={class_name} />
{/if}
