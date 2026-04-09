<script lang="ts">
	import type { ActionData, PageData, TaskItem } from '$lib/dash-page-types'
	import { dash_reorder_client } from '$lib/dash-reorder-client'
	import { flip } from 'svelte/animate'
	import { fade, slide } from 'svelte/transition'
	import DashCreateTaskCard from './DashCreateTaskCard.svelte'
	import DashEmptyTaskHint from './DashEmptyTaskHint.svelte'
	import DashTaskCard from './DashTaskCard.svelte'

	interface Props {
		data: PageData
		form: ActionData
		input_class: string
		has_create_row: boolean
		on_quick_add_at_top: () => Promise<void>
		inline_edit_focus_pulse?: number
		editing_task_id: string | undefined
		on_start_task_edit: (task_id: string) => void
		/** Arrow-key row switch: focus the next editor title (pulse) after changing the active task. */
		on_arrow_navigate_to_task: (task_id: string) => void
		on_cancel_task_edit: () => void
		on_task_saved: (task_id: string) => Promise<void>
		on_blur_commit_saved: (task_id: string) => Promise<void>
		on_title_enter_new_row: (task_id: string) => Promise<void>
		on_discard_empty_inline: (task_id: string) => Promise<void>
		display_tasks: Array<TaskItem>
		has_filter: boolean
		completing_task_id: string | null | undefined
		deleting_task_id: string | null | undefined
		uncompleting_task_id: string | null | undefined
		on_complete: (task_id: string) => Promise<void>
		on_delete_completed: (task_id: string) => Promise<void>
		on_uncomplete: (task_id: string) => Promise<void>
		is_reorder_enabled?: boolean
		on_reorder_commit?: (dragged_task_id: string, insert_before_task_id?: string) => Promise<void>
	}

	const {
		data,
		form,
		input_class,
		has_create_row,
		on_quick_add_at_top,
		inline_edit_focus_pulse = 0,
		editing_task_id,
		on_start_task_edit,
		on_arrow_navigate_to_task,
		on_cancel_task_edit,
		on_task_saved,
		on_blur_commit_saved,
		on_title_enter_new_row,
		on_discard_empty_inline,
		display_tasks,
		has_filter,
		completing_task_id,
		deleting_task_id,
		uncompleting_task_id,
		on_complete,
		on_delete_completed,
		on_uncomplete,
		is_reorder_enabled = false,
		on_reorder_commit,
	}: Props = $props()

	let is_drag_over_end = $state(false)
	let dragged_task_id = $state<string | undefined>()
	let reorder_indicator_id = $state<string | undefined>()
	const REORDER_END_INDICATOR_ID = '__end__'
	const is_show_end_indicator = $derived(
		(reorder_indicator_id === REORDER_END_INDICATOR_ID || is_drag_over_end) &&
			dragged_task_id !== undefined,
	)

	function clear_drag_ui(): void {
		is_drag_over_end = false
		dragged_task_id = undefined
		reorder_indicator_id = undefined
	}

	function resolve_dropped_task_id(dropped_id: string | undefined): string | undefined {
		if (dropped_id !== undefined) return dropped_id

		return dragged_task_id
	}

	async function handle_row_drop(input: {
		target_task_id: string
		dropped_id: string | undefined
		pointer_client_y: number
		row_client_top: number
		row_client_height: number
	}): Promise<void> {
		if (on_reorder_commit === undefined) return
		const dropped_task_id = resolve_dropped_task_id(input.dropped_id)
		if (dropped_task_id === undefined) return

		const ordered_ids = display_tasks.map((row) => row.id)
		const insert_before_id = dash_reorder_client.pick_insert_before_at_drop({
			ordered_task_ids: ordered_ids,
			target_task_id: input.target_task_id,
			pointer_client_y: input.pointer_client_y,
			row_client_top: input.row_client_top,
			row_client_height: input.row_client_height,
		})

		if (insert_before_id !== undefined && dropped_task_id === insert_before_id) return

		clear_drag_ui()
		await on_reorder_commit(dropped_task_id, insert_before_id)
	}

	async function handle_end_drop(dropped_id: string | undefined): Promise<void> {
		if (on_reorder_commit === undefined) return
		const dropped_task_id = resolve_dropped_task_id(dropped_id)
		if (dropped_task_id === undefined) return

		clear_drag_ui()
		await on_reorder_commit(dropped_task_id)
	}

	function handle_navigate_arrow(direction: 'up' | 'down', current_task_id: string): void {
		const index = display_tasks.findIndex((task) => task.id === current_task_id)
		if (index === -1) return

		const next_index = direction === 'up' ? index - 1 : index + 1
		const next_item = display_tasks[next_index]

		if (next_item !== undefined) {
			on_arrow_navigate_to_task(next_item.id)
		}
	}
</script>

<div class="flex flex-col gap-y-[5px]">
	{#if has_create_row}
		<DashCreateTaskCard {data} {form} {input_class} variant="list_row" {on_quick_add_at_top} />
	{/if}

	{#if display_tasks.length === 0}
		<DashEmptyTaskHint {has_filter} is_completed_view={data.is_completed_view} />
	{:else}
		<div class="flex flex-col gap-y-[5px]" role="list">
			{#each display_tasks as task_item (task_item.id)}
				<div
					class="relative"
					animate:flip={{ duration: 200 }}
					in:fade={{ duration: 200 }}
					out:slide={{ duration: 200 }}
				>
					{#if reorder_indicator_id === task_item.id && dragged_task_id !== task_item.id}
						<div
							class="pointer-events-none absolute -top-[3px] right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
						></div>
					{/if}
					<DashTaskCard
						{task_item}
						{data}
						{form}
						{input_class}
						is_completed_view={data.is_completed_view}
						{completing_task_id}
						{deleting_task_id}
						{uncompleting_task_id}
						{editing_task_id}
						{on_start_task_edit}
						{on_cancel_task_edit}
						focus_pulse={task_item.id === editing_task_id ? inline_edit_focus_pulse : 0}
						on_task_saved={async () => {
							await on_task_saved(task_item.id)
						}}
						on_blur_commit_saved={async () => {
							await on_blur_commit_saved(task_item.id)
						}}
						{on_title_enter_new_row}
						on_discard_empty_inline={async () => {
							await on_discard_empty_inline(task_item.id)
						}}
						{on_complete}
						{on_delete_completed}
						{on_uncomplete}
						on_navigate_arrow={(direction: 'up' | 'down') => {
							handle_navigate_arrow(direction, task_item.id)
						}}
						reorder_drag_enabled={is_reorder_enabled && editing_task_id === undefined}
						on_reorder_row_drag_over={(client_y, top, height) => {
							if (!is_reorder_enabled || on_reorder_commit === undefined) return

							is_drag_over_end = false

							const ordered_ids = display_tasks.map((row) => row.id)
							const insert_before = dash_reorder_client.pick_insert_before_at_drop({
								ordered_task_ids: ordered_ids,
								target_task_id: task_item.id,
								pointer_client_y: Number(client_y),
								row_client_top: Number(top),
								row_client_height: Number(height),
							})

							reorder_indicator_id = insert_before ?? REORDER_END_INDICATOR_ID
						}}
						on_reorder_row_drop={(
							dragged_id: string | undefined,
							pointer_y: number,
							row_top: number,
							row_height: number,
						) => {
							void handle_row_drop({
								target_task_id: task_item.id,
								dropped_id: dragged_id,
								pointer_client_y: pointer_y,
								row_client_top: row_top,
								row_client_height: row_height,
							})
						}}
						on_reorder_drag_start={(task_id: string) => {
							dragged_task_id = task_id
						}}
						on_reorder_drag_end={() => {
							clear_drag_ui()
						}}
					/>
				</div>
			{/each}
			{#if is_reorder_enabled && on_reorder_commit !== undefined && display_tasks.length > 0}
				<div
					class="relative min-h-3 rounded-lg {is_drag_over_end
						? 'bg-blue-100/40 dark:bg-blue-900/20'
						: ''}"
					aria-hidden="true"
					ondragover={(drag_event) => {
						drag_event.preventDefault()
						is_drag_over_end = true
					}}
					ondragleave={(drag_event) => {
						const next = drag_event.relatedTarget as Node | null
						if (next !== null && drag_event.currentTarget.contains(next)) return
						is_drag_over_end = false
					}}
					ondrop={(drag_event) => {
						drag_event.preventDefault()
						const transfer = drag_event.dataTransfer
						const raw_id = transfer === null ? '' : transfer.getData('text/plain')

						void handle_end_drop(raw_id === '' ? undefined : raw_id)
					}}
				>
					{#if is_show_end_indicator}
						<div
							class="pointer-events-none absolute -top-[0.5px] right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
						></div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
