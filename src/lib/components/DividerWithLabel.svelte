<script lang="ts">
	interface Props {
		label: string
	}

	const { label }: Props = $props()
</script>

<div class="relative mt-6">
	<div class="absolute inset-0 flex items-center">
		<div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
	</div>
	<div class="relative flex justify-center text-sm">
		<span class="bg-white px-2 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
			{label}
		</span>
	</div>
</div>
