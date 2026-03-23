<script lang="ts">
	import { loading_button_styles, type ButtonVariant } from '$lib/components/loading-button-styles'
	import Spinner from '$lib/components/Spinner.svelte'
	import type { Snippet } from 'svelte'

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

	const spinner_variant = $derived(loading_button_styles.SPINNER_VARIANT_BY_BUTTON[variant])

	function handle_click(): void {
		if (is_loading || is_disabled) return
		void on_click?.()
	}
</script>

<button
	type="button"
	disabled={is_loading || is_disabled}
	class="{loading_button_styles.COMMON_BUTTON_CLASSES} {loading_button_styles.VARIANT_CLASSES[
		variant
	]}"
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
