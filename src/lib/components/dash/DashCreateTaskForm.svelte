<script lang="ts">
	/* eslint-disable max-lines -- create-task form: fields grouped in one place for UX cohesion */
	/* eslint-disable unicorn/prevent-abbreviations, sonarjs/void-use, @typescript-eslint/no-floating-promises, promise/catch-or-return, promise/prefer-await-to-then, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-magic-numbers, sonarjs/no-identical-functions, unicorn/no-useless-undefined -- DOM measurement, $effect tick scheduling, and mirrored title/detail Enter handlers */
	import type { ActionResult } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
	import RecurrenceInput from '$lib/components/RecurrenceInput.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import { dash_display } from '$lib/dash-display'
	import type { ActionData, PageData } from '$lib/dash-page-types'
	import { m } from '$lib/paraglide/messages'
	import { rrule_summary } from '$lib/rrule-summary'
	import { tick } from 'svelte'

	interface Props {
		data: PageData
		form: ActionData
		input_class: string
		on_dismiss: () => void
		/** Increment to re-focus title while the form stays open (e.g. after the last task in a save chain). */
		create_ui_pulse?: number
	}

	const { data, form, input_class, on_dismiss, create_ui_pulse = 0 }: Props = $props()

	const label_suggestion_limit = 5
	const label_blur_delay_ms = 150
	const blur_commit_delay_ms = 120
	const pointer_up_settle_ms = 16

	const dialog_recurrence_class =
		'fixed left-1/2 top-1/2 z-[100] max-h-[90vh] w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-600 dark:bg-gray-800'

	let form_element = $state<HTMLFormElement | undefined>()
	let title_input_el = $state<HTMLInputElement | undefined>()
	let detail_textarea_el = $state<HTMLTextAreaElement | undefined>()
	let due_picker_input_el = $state<HTMLInputElement | undefined>()
	let is_date_picker_open = $state(false)

	let form_title = $state('')
	let form_detail = $state('')
	let form_label_input = $state('')
	let is_form_label_focused = $state(false)
	let form_selected_labels = $state<Array<string>>([])
	let form_due_date = $state('')
	let form_rrule = $state('')
	let is_form_saving = $state(false)
	let create_error = $state<string | undefined>()
	let recurrence_dialog_element = $state<HTMLDialogElement | undefined>()

	let blur_commit_timer: ReturnType<typeof globalThis.setTimeout> | undefined = undefined
	let is_pointer_held = $state(false)
	let is_blur_deferred_to_pointer_up = $state(false)
	let is_blur_submit_pending = $state(false)

	const pending_new_label_names = $derived(
		form_selected_labels.filter(
			(name) => !data.labels.some((label_row) => label_row.name === name),
		),
	)

	const label_suggestions = $derived(
		form_label_input.trim()
			? data.labels
					.filter(
						(label_row) =>
							label_row.name.toLowerCase().includes(form_label_input.toLowerCase()) &&
							!form_selected_labels.includes(label_row.name),
					)
					.slice(0, label_suggestion_limit)
			: [],
	)

	const due_display_text = $derived(
		form_due_date
			? new Date(`${form_due_date}T12:00:00`).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'short',
					day: 'numeric',
				})
			: '',
	)

	const RRULE_BUTTON_DISPLAY_MAX_CHARS = 48

	function truncate_rule_for_button(raw: string): string {
		if (raw.length <= RRULE_BUTTON_DISPLAY_MAX_CHARS) return raw

		return `${raw.slice(0, RRULE_BUTTON_DISPLAY_MAX_CHARS - 1)}…`
	}

	const recurrence_edit_button_text = $derived.by(() => {
		if (!form_rrule.trim()) return ''
		const summary = rrule_summary.format_rrule_summary(form_rrule)
		if (summary !== '') return summary

		return m.dash_recurrence_unparsed_display({ rule: truncate_rule_for_button(form_rrule) })
	})

	function sync_detail_height(): void {
		const el = detail_textarea_el
		if (!el) return

		el.style.height = 'auto'
		el.style.height = `${Math.max(el.scrollHeight, 36)}px`
	}

	$effect(() => {
		void form_detail
		void detail_textarea_el
		tick().then(sync_detail_height)
	})

	$effect(() => {
		if (!form_element) return
		tick().then(() => title_input_el?.focus())
	})

	$effect(() => {
		void create_ui_pulse

		if (create_ui_pulse > 0) {
			tick().then(() => title_input_el?.focus())
		}
	})

	function add_label(name: string): void {
		const trimmed = name.trim()

		if (trimmed && !form_selected_labels.includes(trimmed)) {
			form_selected_labels = [...form_selected_labels, trimmed]
		}

		form_label_input = ''
	}

	function toggle_label_name(name: string): void {
		form_selected_labels = form_selected_labels.includes(name)
			? form_selected_labels.filter((label_name) => label_name !== name)
			: [...form_selected_labels, name]
	}

	function handle_label_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.isComposing) {
			key_event.preventDefault()
			if (form_label_input.trim()) add_label(form_label_input)
		}
	}

	function reset_form(): void {
		form_title = ''
		form_detail = ''
		form_label_input = ''
		form_selected_labels = []
		form_due_date = ''
		form_rrule = ''
		create_error = undefined
	}

	function close_dialogs(): void {
		recurrence_dialog_element?.close()
	}

	function is_plain_object(value: unknown): value is Record<string, unknown> {
		return value !== null && typeof value === 'object'
	}

	function read_optional_string_field(payload: unknown, field: string): string | undefined {
		if (!is_plain_object(payload) || !(field in payload)) return undefined

		const value = payload[field]

		return typeof value === 'string' ? value : undefined
	}

	function apply_failure_error_message(result: ActionResult): void {
		if (result.type !== 'failure') return

		create_error = read_optional_string_field(result.data, 'error') ?? m.dash_create_error_default()
	}

	function is_dialog_open(): boolean {
		return Boolean(recurrence_dialog_element?.open)
	}

	function is_focus_still_inside_form(related: Node | null): boolean {
		return related !== null && Boolean(form_element?.contains(related))
	}

	function is_due_input_focused(): boolean {
		return due_picker_input_el !== undefined && document.activeElement === due_picker_input_el
	}

	function is_blocking_interaction_active(): boolean {
		return is_dialog_open() || is_form_saving || is_date_picker_open
	}

	function should_abort_blur_commit(): boolean {
		if (form_element?.contains(document.activeElement)) return true
		if (is_due_input_focused()) return true

		return is_blocking_interaction_active()
	}

	function is_create_form_empty(): boolean {
		return (
			!form_title.trim() &&
			!form_detail.trim() &&
			form_selected_labels.length === 0 &&
			!form_due_date &&
			!form_rrule
		)
	}

	function clear_blur_commit_timer(): void {
		if (blur_commit_timer === undefined) return

		globalThis.clearTimeout(blur_commit_timer)
		blur_commit_timer = undefined
	}

	function commit_pending_label_input(): void {
		if (form_label_input.trim()) add_label(form_label_input)
	}

	function run_deferred_blur_commit(): void {
		if (should_abort_blur_commit()) return

		if (is_create_form_empty()) {
			reset_form()
			on_dismiss()

			return
		}

		commit_pending_label_input()
		is_blur_submit_pending = true
		form_element?.requestSubmit()
	}

	function handle_form_focusout(focus_event: FocusEvent): void {
		if (is_focus_still_inside_form(focus_event.relatedTarget as Node | null)) return

		clear_blur_commit_timer()

		if (is_pointer_held) {
			is_blur_deferred_to_pointer_up = true

			return
		}

		blur_commit_timer = globalThis.setTimeout(() => {
			blur_commit_timer = undefined
			run_deferred_blur_commit()
		}, blur_commit_delay_ms)
	}

	function handle_document_pointerdown(): void {
		is_pointer_held = true
	}

	function handle_document_pointerup(): void {
		is_pointer_held = false

		if (!is_blur_deferred_to_pointer_up) return

		is_blur_deferred_to_pointer_up = false
		globalThis.setTimeout(run_deferred_blur_commit, pointer_up_settle_ms)
	}

	function handle_document_pointercancel(): void {
		is_pointer_held = false
		is_blur_deferred_to_pointer_up = false
	}

	function handle_document_keydown(key_event: KeyboardEvent): void {
		if (key_event.key !== 'Escape' || key_event.isComposing) return
		if (is_dialog_open()) return

		key_event.preventDefault()
		reset_form()
		close_dialogs()
		on_dismiss()
	}

	function try_submit_form(): void {
		if (is_form_saving || is_create_form_empty()) return

		commit_pending_label_input()

		form_element?.requestSubmit()
	}

	function handle_title_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.shiftKey && !key_event.isComposing) {
			key_event.preventDefault()
			try_submit_form()
		}
	}

	function handle_detail_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.shiftKey && !key_event.isComposing) {
			key_event.preventDefault()
			try_submit_form()
		}
	}

	function open_due_picker(): void {
		const el = due_picker_input_el
		if (!el) return

		is_date_picker_open = true

		if (typeof el.showPicker === 'function') {
			el.showPicker()
		} else {
			el.click()
		}
	}

	async function apply_success_blur_outcome(
		update: (options?: { reset?: boolean }) => Promise<void>,
	): Promise<void> {
		reset_form()
		close_dialogs()
		await update({ reset: false })
		on_dismiss()
	}

	async function apply_success_normal_outcome(
		update: (options?: { reset?: boolean }) => Promise<void>,
	): Promise<void> {
		reset_form()
		close_dialogs()
		await update({ reset: false })
		await tick()
		title_input_el?.focus()
	}

	async function finalize_create_action(
		result: ActionResult,
		update: (options?: { reset?: boolean }) => Promise<void>,
	): Promise<void> {
		is_form_saving = false
		const did_blur_submit = is_blur_submit_pending

		is_blur_submit_pending = false

		if (result.type !== 'success') {
			apply_failure_error_message(result)
			await update({ reset: false })

			return
		}

		await (did_blur_submit
			? apply_success_blur_outcome(update)
			: apply_success_normal_outcome(update))
	}

	async function handle_create_enhance_result(input: {
		result: ActionResult
		update: (options?: { reset?: boolean }) => Promise<void>
	}): Promise<void> {
		await finalize_create_action(input.result, input.update)
	}
</script>

<svelte:window onkeydown={handle_document_keydown} />
<svelte:document
	onpointerdown={handle_document_pointerdown}
	onpointerup={handle_document_pointerup}
	onpointercancel={handle_document_pointercancel}
/>

<form
	bind:this={form_element}
	method="POST"
	action="?/create"
	use:enhance={() => {
		clear_blur_commit_timer()
		is_form_saving = true

		return handle_create_enhance_result
	}}
	class="relative min-w-0 flex-1 space-y-1.5"
	onfocusout={handle_form_focusout}
>
	<input type="hidden" name="insert_at_top" value="1" />

	{#if is_form_saving}
		<div
			class="absolute end-0 top-0 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
		>
			<Spinner size="sm" variant="dark" />
			{m.dash_create_saving()}
		</div>
	{/if}

	<input
		bind:this={title_input_el}
		type="text"
		name="title"
		bind:value={form_title}
		placeholder={m.dash_create_title_placeholder()}
		class={input_class}
		onkeydown={handle_title_keydown}
	/>

	<textarea
		bind:this={detail_textarea_el}
		name="detail"
		bind:value={form_detail}
		placeholder={m.dash_create_detail_placeholder()}
		rows="1"
		class="{input_class} min-h-9 resize-none overflow-hidden"
		onkeydown={handle_detail_keydown}
		oninput={sync_detail_height}
	></textarea>

	<div class="space-y-1.5">
		{#each form_selected_labels as hidden_label (hidden_label)}
			<input type="hidden" name="labels" value={hidden_label} />
		{/each}
		{#if data.labels.length > 0 || pending_new_label_names.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each data.labels as label_row (label_row.id)}
					<button
						type="button"
						onclick={() => {
							toggle_label_name(label_row.name)
						}}
						class={dash_display.label_chip_filter_class(
							label_row.name,
							form_selected_labels.includes(label_row.name),
						)}
					>
						{label_row.name}
					</button>
				{/each}
				{#each pending_new_label_names as new_label (new_label)}
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
								form_selected_labels = form_selected_labels.filter((name) => name !== new_label)
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
				bind:value={form_label_input}
				onkeydown={handle_label_keydown}
				onfocus={() => (is_form_label_focused = true)}
				onblur={() => {
					setTimeout(() => {
						is_form_label_focused = false
					}, label_blur_delay_ms)
				}}
				placeholder={m.dash_create_label_placeholder()}
				class={input_class}
			/>
			{#if is_form_label_focused && label_suggestions.length > 0}
				<div
					class="absolute top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
				>
					{#each label_suggestions as suggestion (suggestion.id)}
						<button
							type="button"
							class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
							onclick={() => {
								add_label(suggestion.name)
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
		bind:this={due_picker_input_el}
		type="date"
		name="due_date"
		bind:value={form_due_date}
		class="sr-only"
		tabindex={-1}
		aria-hidden="true"
		onchange={() => {
			is_date_picker_open = false
			title_input_el?.focus()
		}}
	/>
	<input type="hidden" name="recurrence_rule" value={form_rrule} />

	<div class="flex flex-wrap items-center gap-2">
		{#if form_due_date}
			<div class="flex flex-wrap items-center gap-1.5">
				<button
					type="button"
					onclick={open_due_picker}
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
				<span class="text-sm text-gray-700 dark:text-gray-200">{due_display_text}</span>
				<button
					type="button"
					onclick={() => {
						form_due_date = ''
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
				onclick={open_due_picker}
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

		{#if form_rrule}
			<button
				type="button"
				data-testid="dash-create-recurrence-button"
				onclick={() => recurrence_dialog_element?.showModal()}
				class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/80"
			>
				{recurrence_edit_button_text}
			</button>
		{:else}
			<button
				type="button"
				onclick={() => recurrence_dialog_element?.showModal()}
				class="flex h-9 w-9 shrink-0 items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600 dark:hover:bg-gray-700 dark:hover:text-blue-400"
				aria-label={m.dash_create_recurrence_aria()}
			>
				<span class="text-lg" aria-hidden="true">↻</span>
			</button>
		{/if}
	</div>

	<dialog bind:this={recurrence_dialog_element} class={dialog_recurrence_class}>
		<h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
			{m.dash_create_recurrence_dialog_title()}
		</h2>
		<RecurrenceInput bind:value={form_rrule} />
		<div class="mt-4 flex justify-end">
			<button
				type="button"
				class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 dark:bg-blue-500"
				onclick={() => {
					recurrence_dialog_element?.close()
					title_input_el?.focus()
				}}
			>
				{m.dash_create_recurrence_close()}
			</button>
		</div>
	</dialog>

	{#if create_error}
		<p class="text-sm text-red-500">{create_error}</p>
	{/if}
	{#if form?.error}
		<p class="text-sm text-red-500">{form.error}</p>
	{/if}

	<button type="submit" class="sr-only" tabindex={-1} aria-hidden="true">submit</button>
</form>
