<script lang="ts">
	interface Props {
		/** Short label shown before the message (e.g. "Error:"). */
		label: string
		/** Body text of the error message. */
		message: string
	}

	const { label, message }: Props = $props()
</script>

<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700" role="alert">
	<span class="font-medium">{label}</span>
	{message}
</div>
