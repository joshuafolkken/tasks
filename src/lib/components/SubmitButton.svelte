<script lang="ts">
	import Spinner from '$lib/components/Spinner.svelte'
	import type { Snippet } from 'svelte'

	type ButtonVariant = 'primary' | 'outline' | 'social-white' | 'social-dark'

	interface Props {
		/** Button label when not loading (or text next to icon when <code>icon</code> is set). */
		label: string
		/** Optional icon shown before the label when not loading. */
		icon?: Snippet
		loading_label: string
		is_loading?: boolean
		is_disabled?: boolean
		variant?: ButtonVariant
	}

	const {
		label,
		icon,
		loading_label,
		is_loading = false,
		is_disabled = false,
		variant = 'primary',
	}: Props = $props()

	const common_classes = 'gap-3 px-4 py-3 transition-all hover:shadow-md active:scale-[0.98]'

	const SPINNER_VARIANT_BY_BUTTON: Record<ButtonVariant, 'gray' | 'blue' | 'dark'> = {
		primary: 'dark',
		outline: 'blue',
		'social-white': 'blue',
		'social-dark': 'dark',
	}

	const form_variant_classes = 'rounded-lg'
	const social_variant_classes = 'group relative rounded-xl text-sm font-semibold'

	const variant_classes: Record<ButtonVariant, string> = {
		primary: `bg-blue-600 text-white hover:bg-blue-700 font-semibold ${form_variant_classes}`,
		outline: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium ${form_variant_classes}`,
		'social-white': `${social_variant_classes} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`,
		'social-dark': `${social_variant_classes} border border-gray-900 bg-gray-900 text-white hover:bg-gray-800`,
	}

	const spinner_variant = $derived(SPINNER_VARIANT_BY_BUTTON[variant])
</script>

<button
	type="submit"
	disabled={is_loading || is_disabled}
	class="flex w-full items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 {common_classes} {variant_classes[
		variant
	]}"
>
	{#if is_loading}
		<Spinner size="md" variant={spinner_variant} />
		<span>{loading_label}</span>
	{:else}
		{#if icon}
			{@render icon()}
		{/if}
		<span>{label}</span>
	{/if}
</button>
