<script lang="ts">
	import { enhance } from '$app/forms'
	import RecurrenceInput from '$lib/components/RecurrenceInput.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import type { ActionData, PageData, TaskItem } from '$lib/dash-page-types'
	import { m } from '$lib/paraglide/messages'
	import { tick } from 'svelte'
	import { slide } from 'svelte/transition'
	import { dash_task_form_shared, DIALOG_RECURRENCE_CLASS } from './dash-task-form-shared'
	import { DashInlineEditorState } from './DashInlineEditorState.svelte'
	import DashTaskLabelPicker from './DashTaskLabelPicker.svelte'

	interface Props {
		task_item: TaskItem
		data: PageData
		form: ActionData
		input_class: string
		/** Increment to re-focus the title input when the editor is already open. */
		focus_request_id?: number
		on_escape: () => void
		on_saved: () => Promise<void>
		/** After a successful save triggered by blur (dirty form): exit edit without chaining to the next row. */
		on_blur_commit_saved?: () => Promise<void>
		/** After a successful save triggered by Enter in the title field: insert a new task below and edit it. */
		on_title_enter_saved?: () => Promise<void>
		/** When the editor loses focus and all fields are empty, persist and remove the open task if still empty. */
		on_try_discard_empty?: () => Promise<void>
		/** Navigate up or down via keyboard arrow keys */
		on_navigate_arrow?: ((direction: 'up' | 'down') => void) | undefined
	}

	const {
		task_item,
		data,
		form,
		input_class,
		focus_request_id = 0,
		on_escape,
		on_saved,
		on_blur_commit_saved,
		on_title_enter_saved,
		on_try_discard_empty,
		on_navigate_arrow,
	}: Props = $props()

	const state = new DashInlineEditorState(
		() => task_item,
		() => data.labels,
		{
			get_on_escape: () => on_escape,
			get_on_saved: () => on_saved,
			get_on_blur_commit_saved: () => on_blur_commit_saved,
			get_on_title_enter_saved: () => on_title_enter_saved,
			get_on_try_discard_empty: () => on_try_discard_empty,
			get_on_navigate_arrow: () => on_navigate_arrow,
		},
	)

	$effect(() => {
		if (focus_request_id <= state.last_seen_focus_request_id) return

		state.last_seen_focus_request_id = focus_request_id

		void (async () => {
			await tick()
			await tick()
			await new Promise<void>((resolve) => {
				globalThis.requestAnimationFrame(() => {
					resolve()
				})
			})
			const title_element = state.title_input_el

			if (title_element) {
				title_element.focus()
				title_element.setSelectionRange(title_element.value.length, title_element.value.length)
			}
		})()
	})
</script>

<svelte:window
	onkeydown={(key_event: KeyboardEvent) => {
		state.handle_document_keydown(key_event)
	}}
/>
<svelte:document
	onpointerdown={() => {
		state.handle_document_pointerdown()
	}}
	onpointerup={async () => {
		await state.handle_document_pointerup()
	}}
	onpointercancel={() => {
		state.handle_document_pointercancel()
	}}
/>

<div
	data-testid="dash-inline-editor-slide-wrapper"
	transition:slide|global={{ duration: 200, axis: 'y' }}
>
	<div class="-m-1 overflow-hidden p-1">
		<form
			bind:this={state.form_element}
			method="POST"
			action="?/update_task"
			use:enhance={state.get_enhance_callback()}
			class="relative min-w-0 flex-1 space-y-1.5"
			onfocusout={(focus_event: FocusEvent) => {
				state.handle_form_focusout(focus_event)
			}}
		>
			<input type="hidden" name="task_id" value={task_item.id} />

			{#if state.is_form_saving}
				<div
					class="absolute inset-e-0 top-0 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
				>
					<Spinner size="sm" variant="dark" />
					{m.dash_create_saving()}
				</div>
			{/if}

			<input
				bind:this={state.title_input_el}
				type="text"
				name="title"
				data-testid="dash-inline-title-input"
				bind:value={state.form_title}
				placeholder={m.dash_create_title_placeholder()}
				class={input_class}
				onkeydown={(key_event: KeyboardEvent) => {
					state.handle_title_keydown(key_event)
				}}
			/>

			<textarea
				bind:this={state.detail_textarea_el}
				name="detail"
				data-testid="dash-inline-detail-input"
				bind:value={state.form_detail}
				placeholder={m.dash_create_detail_placeholder()}
				rows="1"
				class="{input_class} min-h-9 resize-none overflow-hidden"
				onkeydown={(key_event: KeyboardEvent) => {
					state.handle_detail_keydown(key_event)
				}}
				oninput={() => {
					dash_task_form_shared.sync_textarea_height(state.detail_textarea_el)
				}}
			></textarea>

			<div class="space-y-1.5">
				<DashTaskLabelPicker
					all_labels={data.labels}
					selected_labels={state.form_selected_labels}
					bind:label_input={state.form_label_input}
					{input_class}
					input_testid="dash-inline-label-input"
					on_toggle={(name: string) => {
						state.toggle_label_name(name)
					}}
					on_add={(name: string) => {
						state.add_label(name)
					}}
					on_remove_pending={(name: string) => {
						state.form_selected_labels = state.form_selected_labels.filter(
							(label_name) => label_name !== name,
						)
					}}
					on_keydown={(key_event: KeyboardEvent) => {
						state.handle_label_keydown(key_event)
					}}
				/>
			</div>

			<input
				bind:this={state.due_picker_input_el}
				type="date"
				name="due_date"
				bind:value={state.form_due_date}
				class="sr-only"
				tabindex={-1}
				aria-hidden="true"
				onchange={() => {
					state.is_date_picker_open = false
					state.title_input_el?.focus()
				}}
			/>
			<input type="hidden" name="recurrence_rule" value={state.form_rrule} />

			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onclick={() => {
						state.open_due_picker()
					}}
					class="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
					aria-label={m.dash_create_due_pick_aria()}
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						></path>
					</svg>
				</button>
				{#if state.form_due_date}
					<span class="text-sm text-gray-700 dark:text-gray-200">{state.due_display_text}</span>
					<button
						type="button"
						onclick={() => {
							state.form_due_date = ''
						}}
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
						aria-label={m.dash_create_due_clear()}
					>
						<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path
								fill-rule="evenodd"
								d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
								clip-rule="evenodd"
							></path>
						</svg>
					</button>
				{/if}

				{#if state.form_rrule}
					<button
						type="button"
						data-testid="dash-inline-recurrence-button"
						onclick={(mouse_event) => {
							state.open_recurrence_dialog(
								mouse_event.currentTarget instanceof HTMLElement
									? mouse_event.currentTarget
									: undefined,
							)
						}}
						class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/80"
					>
						{state.recurrence_edit_button_text}
					</button>
				{:else}
					<button
						type="button"
						onclick={(mouse_event) => {
							state.open_recurrence_dialog(
								mouse_event.currentTarget instanceof HTMLElement
									? mouse_event.currentTarget
									: undefined,
							)
						}}
						class="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
						aria-label={m.dash_create_recurrence_aria()}
					>
						<span class="text-lg" aria-hidden="true">↻</span>
					</button>
				{/if}
			</div>

			<dialog
				bind:this={state.recurrence_dialog_element}
				data-testid="dash-recurrence-dialog"
				class={DIALOG_RECURRENCE_CLASS}
				onclose={async () => {
					await state.handle_recurrence_dialog_close()
				}}
			>
				<h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
					{m.dash_create_recurrence_dialog_title()}
				</h2>
				{#key state.recurrence_dialog_mount_key}
					{#if state.recurrence_dialog_mount_key > 0}
						<RecurrenceInput bind:value={state.rrule_draft} />
					{/if}
				{/key}
				<div class="mt-4 flex justify-end">
					<button
						type="button"
						class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:bg-blue-500"
						onmousedown={(mouse_event) => {
							mouse_event.preventDefault()
						}}
						onclick={(mouse_event) => {
							mouse_event.preventDefault()
							mouse_event.stopPropagation()
							state.close_rr_dialog_ui(
								mouse_event.currentTarget instanceof HTMLElement
									? mouse_event.currentTarget
									: undefined,
							)
						}}
					>
						{m.dash_create_recurrence_close()}
					</button>
				</div>
			</dialog>

			{#if state.edit_error}
				<p class="text-sm text-red-500">{state.edit_error}</p>
			{/if}
			{#if form?.error}
				<p class="text-sm text-red-500">{form.error}</p>
			{/if}

			<button type="button" class="sr-only" tabindex={-1} aria-hidden="true">submit</button>
		</form>
	</div>
</div>
