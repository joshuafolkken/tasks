<script lang="ts">
	import { m } from '$lib/paraglide/messages'

	interface Props {
		has_filter: boolean
		is_completed_view: boolean
	}

	const { has_filter, is_completed_view }: Props = $props()

	function empty_task_message(filter_active: boolean, completed_tab: boolean): string {
		if (filter_active) return m.dash_empty_no_match()
		if (completed_tab) return m.dash_empty_completed()

		return m.dash_empty_default()
	}

	const empty_message = $derived(empty_task_message(has_filter, is_completed_view))
</script>

<p class="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
	{empty_message}
</p>
