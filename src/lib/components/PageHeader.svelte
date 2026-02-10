<script lang="ts">
	interface Props {
		title: string
		description: string
	}

	const { title, description }: Props = $props()
</script>

<div class="text-center">
	<h1 class="text-3xl font-extrabold text-gray-900">{title}</h1>
	<p class="mt-2 text-sm text-gray-600">{description}</p>
</div>
