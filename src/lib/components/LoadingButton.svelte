<script lang="ts">
	import Spinner from '$lib/components/Spinner.svelte'
	import type { Snippet } from 'svelte'

	type ButtonVariant = 'primary' | 'outline' | 'social-white' | 'social-dark'

	interface Props {
		label: string
		loading_label: string
		is_loading?: boolean
		is_disabled?: boolean
		variant?: ButtonVariant
		icon?: Snippet
		on_click?: () => void | Promise<void>
	}

	const {
		label,
		loading_label,
		is_loading = false,
		is_disabled = false,
		variant = 'primary',
		icon,
		on_click,
	}: Props = $props()

	const common_classes =
		'flex w-full items-center justify-center gap-3 px-4 py-3 transition-all hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-50'

	const form_variant_classes = 'rounded-lg'
	const social_variant_classes = 'rounded-xl text-sm font-semibold'

	const SPINNER_VARIANT_BY_BUTTON: Record<ButtonVariant, 'gray' | 'blue' | 'dark'> = {
		primary: 'dark',
		outline: 'blue',
		'social-white': 'blue',
		'social-dark': 'dark',
	}

	const variant_classes: Record<ButtonVariant, string> = {
		primary: `bg-blue-600 text-white hover:bg-blue-700 font-semibold dark:bg-blue-500 dark:hover:bg-blue-600 ${form_variant_classes}`,
		outline: `border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 ${form_variant_classes}`,
		'social-white': `${social_variant_classes} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600`,
		'social-dark': `${social_variant_classes} border border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600`,
	}

	const spinner_variant = $derived(SPINNER_VARIANT_BY_BUTTON[variant])

	function handle_click(): void {
		if (is_loading || is_disabled) return
		void on_click?.()
	}
</script>

<button
	type="button"
	disabled={is_loading || is_disabled}
	class="{common_classes} {variant_classes[variant]}"
	onclick={handle_click}
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
