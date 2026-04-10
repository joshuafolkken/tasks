<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import { toast, toast_store } from '$lib/Toast.svelte'
</script>

<div
	class="fixed right-4 bottom-4 z-50 flex flex-col gap-2"
	aria-live="polite"
	aria-label={m.toast_region_aria()}
>
	{#each toast_store.items as item (item.id)}
		<div
			data-testid="toast-error"
			class="flex items-start gap-3 rounded-lg bg-red-600 px-4 py-3 text-sm text-white shadow-lg"
			role="alert"
		>
			<span class="min-w-0 flex-1">{item.message}</span>
			<button
				type="button"
				onclick={() => {
					toast.dismiss(item.id)
				}}
				class="shrink-0 opacity-75 hover:opacity-100"
				aria-label={m.toast_dismiss_aria()}
			>
				✕
			</button>
		</div>
	{/each}
</div>
