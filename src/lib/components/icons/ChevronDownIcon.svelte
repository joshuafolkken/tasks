<script lang="ts">
	import { DEFAULT_ICON_CLASS, type IconProperties } from './types'

	interface Props extends IconProperties {
		is_rotated?: boolean
	}

	const { class: class_name = DEFAULT_ICON_CLASS, is_rotated = false }: Props = $props()
</script>

<svg
	class="{class_name} transition-transform"
	class:rotate-180={is_rotated}
	fill="none"
	stroke="currentColor"
	viewBox="0 0 24 24"
	aria-hidden="true"
>
	<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
</svg>
