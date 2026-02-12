<script lang="ts">
	interface Props {
		id: string
		label: string
		value?: string | undefined
		name?: string | undefined
		type?: 'text' | 'email' | 'password'
		is_disabled?: boolean
		placeholder?: string | undefined
	}

	const {
		id,
		label,
		value = '',
		name,
		type = 'text',
		is_disabled = false,
		placeholder = '',
	}: Props = $props()
</script>

<div>
	<label for={id} class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
		{label}
	</label>
	<input
		{id}
		{name}
		{type}
		{value}
		disabled={is_disabled}
		{placeholder}
		class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:disabled:border-gray-600 dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
	/>
</div>
