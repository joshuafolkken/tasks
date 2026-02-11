<script lang="ts">
	interface Props {
		/** Size of the spinner. */
		size?: 'sm' | 'md'
		/** Border color variant. */
		variant?: 'gray' | 'blue' | 'dark'
	}

	const { size = 'md', variant = 'gray' }: Props = $props()

	const size_class = $derived(size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5')
	const variant_classes: Record<NonNullable<Props['variant']>, string> = {
		gray: 'border-gray-300 border-t-gray-900',
		blue: 'border-gray-300 border-t-blue-600',
		dark: 'border-gray-600 border-t-white',
	}
	const variant_class = $derived(variant_classes[variant])
</script>

<span
	class="inline-block {size_class} animate-spin rounded-full border-2 {variant_class}"
	aria-hidden="true"
	aria-busy="true"
></span>
