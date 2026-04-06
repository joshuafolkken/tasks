<script lang="ts">
	import Spinner from '$lib/components/Spinner.svelte'
	import { dash_display } from '$lib/dash-display'
	import type { ActionData, PageData, TaskItem } from '$lib/dash-page-types'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import DashTaskInlineEditor from './DashTaskInlineEditor.svelte'

	interface Props {
		task_item: TaskItem
		data: PageData
		form: ActionData
		input_class: string
		is_completed_view: boolean
		completing_task_id: string | null | undefined
		deleting_task_id: string | null | undefined
		uncompleting_task_id: string | null | undefined
		editing_task_id: string | undefined
		on_start_task_edit: (task_id: string) => void
		on_cancel_task_edit: () => void
		on_task_saved: () => Promise<void>
		on_blur_commit_saved: () => Promise<void>
		on_title_enter_new_row: (task_id: string) => Promise<void>
		on_discard_empty_inline: () => Promise<void>
		on_complete: (task_id: string) => Promise<void>
		on_delete_completed: (task_id: string) => Promise<void>
		on_uncomplete: (task_id: string) => Promise<void>
		focus_pulse?: number
		reorder_drag_enabled?: boolean
		on_navigate_arrow?: ((direction: 'up' | 'down') => void) | undefined
		on_reorder_row_drag_over?: (
			pointer_client_y: number,
			row_client_top: number,
			row_client_height: number,
		) => void
		on_reorder_row_drop?: (
			dragged_task_id: string | undefined,
			pointer_client_y: number,
			row_client_top: number,
			row_client_height: number,
		) => void
		on_reorder_drag_start?: (task_id: string) => void
		on_reorder_drag_end?: () => void
	}

	const {
		task_item,
		data,
		form,
		input_class,
		is_completed_view,
		completing_task_id,
		deleting_task_id,
		uncompleting_task_id,
		editing_task_id,
		on_start_task_edit,
		on_cancel_task_edit,
		on_task_saved,
		on_blur_commit_saved,
		on_title_enter_new_row,
		on_discard_empty_inline,
		on_complete,
		on_delete_completed,
		on_uncomplete,
		focus_pulse = 0,
		reorder_drag_enabled: is_reorder_drag_enabled = false,
		on_navigate_arrow,
		on_reorder_row_drag_over,
		on_reorder_row_drop,
		on_reorder_drag_start,
		on_reorder_drag_end,
	}: Props = $props()

	const is_editing = $derived(!is_completed_view && editing_task_id === task_item.id)

	const lead_col = 'flex h-9 w-9 shrink-0 items-center justify-center'

	const row_shell =
		'flex gap-2 rounded-xl bg-white px-2 py-1.5 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50'

	const dnd_task_mime = 'text/plain'
</script>

<!-- Row click opens edit (pointer). A11y: title remains a control. -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="{row_shell} {is_editing ? 'items-start' : 'items-center'} relative"
	role="listitem"
	data-testid="dash-task-row"
	data-dash-task-card={task_item.id}
	onclick={(click_event) => {
		if (is_completed_view || is_editing) return
		const click_target = click_event.target
		if (!(click_target instanceof HTMLElement)) return
		if (click_target.closest('[data-dash-complete-task]')) return

		on_start_task_edit(task_item.id)
	}}
	draggable={is_reorder_drag_enabled && !is_editing}
	ondragover={(drag_event) => {
		if (on_reorder_row_drag_over === undefined) return
		drag_event.preventDefault()
		const row_element = drag_event.currentTarget
		if (!(row_element instanceof HTMLElement)) return

		const bounds = row_element.getBoundingClientRect()

		on_reorder_row_drag_over(drag_event.clientY, bounds.top, bounds.height)
	}}
	ondrop={(drag_event) => {
		if (on_reorder_row_drop === undefined) return
		drag_event.preventDefault()

		const transfer = drag_event.dataTransfer
		const raw_id = transfer === null ? '' : transfer.getData(dnd_task_mime)
		const row_element = drag_event.currentTarget

		if (!(row_element instanceof HTMLElement)) return

		const bounds = row_element.getBoundingClientRect()

		on_reorder_row_drop(
			raw_id === '' ? undefined : raw_id,
			drag_event.clientY,
			bounds.top,
			bounds.height,
		)
	}}
	ondragstart={(drag_event) => {
		if (!is_reorder_drag_enabled || is_editing) {
			drag_event.preventDefault()

			return
		}

		const transfer = drag_event.dataTransfer
		if (transfer === null) return

		transfer.setData(dnd_task_mime, task_item.id)
		transfer.effectAllowed = 'move'
		on_reorder_drag_start?.(task_item.id)
	}}
	ondragend={() => {
		on_reorder_drag_end?.()
	}}
>
	{#if !is_completed_view}
		<button
			type="button"
			data-testid="dash-task-complete-button"
			data-dash-complete-task
			onclick={async (mouse_event) => {
				mouse_event.stopPropagation()
				await on_complete(task_item.id)
			}}
			disabled={completing_task_id === task_item.id}
			class="{lead_col} text-gray-300 transition-colors hover:text-green-500 disabled:cursor-wait dark:text-gray-600"
			aria-label={m.dash_task_complete_aria()}
		>
			{#if completing_task_id === task_item.id}
				<Spinner size="sm" variant="dark" />
			{:else}
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
					<circle cx="10" cy="10" r="8" stroke-width="1.5"></circle>
				</svg>
			{/if}
		</button>
	{:else}
		<div class="flex shrink-0 items-center gap-1">
			<button
				type="button"
				onclick={async () => {
					await on_uncomplete(task_item.id)
				}}
				disabled={uncompleting_task_id === task_item.id}
				class="{lead_col} text-green-500 transition-opacity hover:opacity-90 disabled:cursor-wait"
				aria-label={m.dash_task_uncomplete_aria()}
			>
				{#if uncompleting_task_id === task_item.id}
					<Spinner size="sm" variant="dark" />
				{:else}
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
				{/if}
			</button>
			<button
				type="button"
				data-testid="dash-task-delete-completed-button"
				onclick={async () => {
					await on_delete_completed(task_item.id)
				}}
				disabled={deleting_task_id === task_item.id}
				class="{lead_col} text-gray-300 transition-colors hover:text-red-500 disabled:cursor-wait dark:text-gray-600 dark:hover:text-red-400"
				aria-label={m.dash_task_delete_aria()}
			>
				{#if deleting_task_id === task_item.id}
					<Spinner size="sm" variant="dark" />
				{:else}
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M6 6l8 8M14 6l-8 8"
						></path>
					</svg>
				{/if}
			</button>
		</div>
	{/if}

	<div class="min-w-0 flex-1">
		{#if is_editing}
			<DashTaskInlineEditor
				{task_item}
				{data}
				{form}
				{input_class}
				focus_request_id={focus_pulse}
				on_escape={on_cancel_task_edit}
				on_saved={on_task_saved}
				{on_blur_commit_saved}
				on_title_enter_saved={async () => {
					await on_title_enter_new_row(task_item.id)
				}}
				on_try_discard_empty={on_discard_empty_inline}
				on_navigate_arrow={(direction: 'up' | 'down') => on_navigate_arrow?.(direction)}
			/>
		{:else}
			<div class="flex min-w-0 flex-wrap items-center gap-1.5">
				{#if !is_completed_view}
					<button
						type="button"
						data-dash-task-title
						data-task-id={task_item.id}
						onclick={() => {
							on_start_task_edit(task_item.id)
						}}
						class="min-h-9 max-w-full text-left font-medium whitespace-pre-line text-gray-900 dark:text-white"
					>
						{task_item.title}
					</button>
				{:else}
					<span
						class="font-medium whitespace-pre-line text-gray-400 line-through dark:text-gray-500"
					>
						{task_item.title}
					</span>
				{/if}
				{#if task_item.recurrence_rule && !is_completed_view}
					<span class="text-xs text-gray-400" title={task_item.recurrence_rule}>↻</span>
				{/if}
				{#if is_completed_view && task_item.completed_at}
					<span class="text-xs text-gray-400 dark:text-gray-500">
						{m.dash_task_completed_on()}
						{dash_display.format_completed_at(task_item.completed_at, getLocale())}
					</span>
				{:else if task_item.due_date}
					{@const due = dash_display.format_due(task_item.due_date)}
					{#if due}
						<span
							class="rounded-full px-2.5 py-0.5 text-xs font-medium {due.is_overdue
								? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
								: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}"
						>
							{due.text}
						</span>
					{/if}
				{/if}
				{#if !is_completed_view && task_item.task_labels.length > 0}
					{#each task_item.task_labels as task_label_row (task_label_row.label_id)}
						<span class={dash_display.label_chip_filter_class(task_label_row.label.name, true)}>
							{task_label_row.label.name}
						</span>
					{/each}
				{:else if is_completed_view}
					{#each task_item.task_labels as task_label_row (task_label_row.label_id)}
						<span
							class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
						>
							{task_label_row.label.name}
						</span>
					{/each}
				{/if}
			</div>
			{#if task_item.detail}
				<p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{task_item.detail}</p>
			{/if}
		{/if}
	</div>
</div>
