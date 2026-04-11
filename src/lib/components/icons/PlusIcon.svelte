<script lang="ts">
	import { DEFAULT_ICON_CLASS, type IconProperties } from '$lib/types'

	const PLUS_STROKE_PATH = 'M12 4v16m8-8H4'

	const { class: class_name = DEFAULT_ICON_CLASS }: IconProperties = $props()
</script>

<svg class={class_name} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={PLUS_STROKE_PATH}></path>
</svg>
