<script lang="ts">
	/* eslint-disable sonarjs/void-use, @typescript-eslint/no-floating-promises, promise/prefer-await-to-then, promise/catch-or-return -- tick scheduling */
	import { enhance } from '$app/forms'
	import RecurrenceInput from '$lib/components/RecurrenceInput.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import { dash_display } from '$lib/dash-display'
	import type { ActionData, PageData } from '$lib/dash-page-types'
	import { m } from '$lib/paraglide/messages'
	import { tick } from 'svelte'
	import {
		dash_task_form_shared,
		DIALOG_RECURRENCE_CLASS,
		LABEL_BLUR_DELAY_MS,
	} from './dash-task-form-shared'
	import { DashCreateFormState } from './DashCreateFormState.svelte'

	interface Props {
		data: PageData
		form: ActionData
		input_class: string
		on_dismiss: () => void
		/** Increment to re-focus title while the form stays open (e.g. after the last task in a save chain). */
		create_ui_pulse?: number
	}

	const { data, form, input_class, on_dismiss, create_ui_pulse = 0 }: Props = $props()

	const state = new DashCreateFormState(
		() => data.labels,
		() => on_dismiss,
	)

	$effect(() => {
		void create_ui_pulse

		if (create_ui_pulse > 0) {
			tick().then(() => state.title_input_el?.focus())
		}
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
	onpointerup={() => {
		state.handle_document_pointerup()
	}}
	onpointercancel={() => {
		state.handle_document_pointercancel()
	}}
/>

<form
	bind:this={state.form_element}
	method="POST"
	action="?/create"
	use:enhance={state.get_enhance_callback()}
	class="relative min-w-0 flex-1 space-y-1.5"
	onfocusout={(focus_event: FocusEvent) => {
		state.handle_form_focusout(focus_event)
	}}
>
	<input type="hidden" name="insert_at_top" value="1" />

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
		bind:value={state.form_title}
		placeholder={m.dash_create_title_placeholder()}
		class={input_class}
		onkeydown={(key_event: KeyboardEvent) => {
			state.handle_enter_submit_keydown(key_event)
		}}
	/>

	<textarea
		bind:this={state.detail_textarea_el}
		name="detail"
		bind:value={state.form_detail}
		placeholder={m.dash_create_detail_placeholder()}
		rows="1"
		class="{input_class} min-h-9 resize-none overflow-hidden"
		onkeydown={(key_event: KeyboardEvent) => {
			state.handle_enter_submit_keydown(key_event)
		}}
		oninput={() => {
			dash_task_form_shared.sync_textarea_height(state.detail_textarea_el)
		}}
	></textarea>

	<div class="space-y-1.5">
		{#each state.form_selected_labels as hidden_label (hidden_label)}
			<input type="hidden" name="labels" value={hidden_label} />
		{/each}
		{#if data.labels.length > 0 || state.pending_new_label_names.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each data.labels as label_row (label_row.id)}
					<button
						type="button"
						onclick={() => {
							state.toggle_label_name(label_row.name)
						}}
						class={dash_display.label_chip_filter_class(
							label_row.name,
							state.form_selected_labels.includes(label_row.name),
						)}
					>
						{label_row.name}
					</button>
				{/each}
				{#each state.pending_new_label_names as new_label (new_label)}
					<span
						class="{dash_display.label_chip_filter_class(
							new_label,
							true,
						)} inline-flex items-center gap-1"
					>
						{new_label}
						<button
							type="button"
							aria-label="Remove label"
							onclick={() => {
								state.form_selected_labels = state.form_selected_labels.filter(
									(name) => name !== new_label,
								)
							}}
							class="leading-none">×</button
						>
					</span>
				{/each}
			</div>
		{/if}
		<div class="relative">
			<input
				type="text"
				bind:value={state.form_label_input}
				onkeydown={(key_event: KeyboardEvent) => {
					state.handle_label_keydown(key_event)
				}}
				onfocus={() => (state.is_form_label_focused = true)}
				onblur={() => {
					setTimeout(() => {
						state.is_form_label_focused = false
					}, LABEL_BLUR_DELAY_MS)
				}}
				placeholder={m.dash_create_label_placeholder()}
				class={input_class}
			/>
			{#if state.is_form_label_focused && state.label_suggestions.length > 0}
				<div
					class="absolute top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
				>
					{#each state.label_suggestions as suggestion (suggestion.id)}
						<button
							type="button"
							class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
							onclick={() => {
								state.add_label(suggestion.name)
							}}
						>
							{suggestion.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>
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
		{#if state.form_due_date}
			<div class="flex flex-wrap items-center gap-1.5">
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
			</div>
		{:else}
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
		{/if}

		{#if state.form_rrule}
			<button
				type="button"
				data-testid="dash-create-recurrence-button"
				onclick={() => state.recurrence_dialog_element?.showModal()}
				class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/80"
			>
				{state.recurrence_edit_button_text}
			</button>
		{:else}
			<button
				type="button"
				onclick={() => state.recurrence_dialog_element?.showModal()}
				class="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
				aria-label={m.dash_create_recurrence_aria()}
			>
				<span class="text-lg" aria-hidden="true">↻</span>
			</button>
		{/if}
	</div>

	<dialog bind:this={state.recurrence_dialog_element} class={DIALOG_RECURRENCE_CLASS}>
		<h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
			{m.dash_create_recurrence_dialog_title()}
		</h2>
		<RecurrenceInput bind:value={state.form_rrule} />
		<div class="mt-4 flex justify-end">
			<button
				type="button"
				class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:bg-blue-500"
				onclick={() => {
					state.recurrence_dialog_element?.close()
					state.title_input_el?.focus()
				}}
			>
				{m.dash_create_recurrence_close()}
			</button>
		</div>
	</dialog>

	{#if state.create_error}
		<p class="text-sm text-red-500">{state.create_error}</p>
	{/if}
	{#if form?.error}
		<p class="text-sm text-red-500">{form.error}</p>
	{/if}

	<button type="submit" class="sr-only" tabindex={-1} aria-hidden="true">submit</button>
</form>
