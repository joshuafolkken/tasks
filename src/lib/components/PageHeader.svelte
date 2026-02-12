<script lang="ts">
	interface Props {
		title: string
		description: string
	}

	const { title, description }: Props = $props()
</script>

<div class="text-center">
	<h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">{title}</h1>
	<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>
</div>
