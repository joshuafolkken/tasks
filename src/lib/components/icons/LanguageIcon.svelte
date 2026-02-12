<script lang="ts">
	import { DEFAULT_ICON_CLASS, type IconProperties } from './types'

	const { class: class_name = DEFAULT_ICON_CLASS }: IconProperties = $props()
</script>

<svg class={class_name} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
	></path>
</svg>
