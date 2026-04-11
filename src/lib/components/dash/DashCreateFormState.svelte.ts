/* eslint-disable unicorn/prevent-abbreviations, sonarjs/void-use, @typescript-eslint/no-floating-promises, promise/catch-or-return, promise/always-return -- DOM measurement and $effect tick scheduling */
import type { ActionResult } from '@sveltejs/kit'
import type { PageData } from '$lib/dash-page-types'
import { tick } from 'svelte'
import {
	BLUR_COMMIT_DELAY_MS,
	dash_task_form_shared,
	POINTER_UP_SETTLE_MS,
} from './dash-task-form-shared'

type UpdateFn = (options?: { reset?: boolean }) => Promise<void>

interface EnhanceInput {
	result: ActionResult
	update: UpdateFn
}

export class DashCreateFormState {
	readonly #get_labels: () => PageData['labels']
	readonly #get_on_dismiss: () => () => void
	form_element = $state<HTMLFormElement | undefined>()
	title_input_el = $state<HTMLInputElement | undefined>()
	detail_textarea_el = $state<HTMLTextAreaElement | undefined>()
	due_picker_input_el = $state<HTMLInputElement | undefined>()
	is_date_picker_open = $state(false)
	recurrence_dialog_element = $state<HTMLDialogElement | undefined>()
	form_title = $state('')
	form_detail = $state('')
	form_label_input = $state('')
	is_form_label_focused = $state(false)
	form_selected_labels = $state<Array<string>>([])
	form_due_date = $state('')
	form_rrule = $state('')
	is_form_saving = $state(false)
	create_error = $state<string | undefined>()
	#blur_commit_timer: ReturnType<typeof globalThis.setTimeout> | undefined = undefined
	is_pointer_held = $state(false)
	is_blur_deferred_to_pointer_up = $state(false)
	is_blur_submit_pending = $state(false)
	pending_new_label_names = $derived.by(() =>
		dash_task_form_shared.compute_pending_new_labels(this.form_selected_labels, this.#get_labels()),
	)
	label_suggestions = $derived.by(() =>
		dash_task_form_shared.compute_label_suggestions(
			this.form_label_input,
			this.#get_labels(),
			this.form_selected_labels,
		),
	)
	due_display_text = $derived(dash_task_form_shared.format_due_date_display(this.form_due_date))
	recurrence_edit_button_text = $derived(
		dash_task_form_shared.format_recurrence_button_text(this.form_rrule),
	)

	constructor(get_labels: () => PageData['labels'], get_on_dismiss: () => () => void) {
		this.#get_labels = get_labels
		this.#get_on_dismiss = get_on_dismiss

		$effect(() => {
			void this.form_detail
			void this.detail_textarea_el
			tick().then(() => {
				dash_task_form_shared.sync_textarea_height(this.detail_textarea_el)
			})
		})

		$effect(() => {
			if (!this.form_element) return
			tick().then(() => this.title_input_el?.focus())
		})
	}

	add_label(name: string): void {
		const trimmed = name.trim()

		if (trimmed && !this.form_selected_labels.includes(trimmed)) {
			this.form_selected_labels = [...this.form_selected_labels, trimmed]
		}

		this.form_label_input = ''
	}

	toggle_label_name(name: string): void {
		this.form_selected_labels = this.form_selected_labels.includes(name)
			? this.form_selected_labels.filter((label_name) => label_name !== name)
			: [...this.form_selected_labels, name]
	}

	handle_label_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.isComposing) {
			key_event.preventDefault()
			if (this.form_label_input.trim()) this.add_label(this.form_label_input)
		}
	}

	reset_form(): void {
		this.form_title = ''
		this.form_detail = ''
		this.form_label_input = ''
		this.form_selected_labels = []
		this.form_due_date = ''
		this.form_rrule = ''
		this.create_error = undefined
	}

	close_dialogs(): void {
		this.recurrence_dialog_element?.close()
	}

	clear_blur_commit_timer(): void {
		if (this.#blur_commit_timer === undefined) return

		globalThis.clearTimeout(this.#blur_commit_timer)
		this.#blur_commit_timer = undefined
	}

	is_dialog_open(): boolean {
		return Boolean(this.recurrence_dialog_element?.open)
	}

	#is_due_input_focused(): boolean {
		return (
			this.due_picker_input_el !== undefined && document.activeElement === this.due_picker_input_el
		)
	}

	#is_blocking_interaction_active(): boolean {
		return this.is_dialog_open() || this.is_form_saving || this.is_date_picker_open
	}

	#should_abort_blur_commit(): boolean {
		if (this.form_element?.contains(document.activeElement)) return true
		if (this.#is_due_input_focused()) return true

		return this.#is_blocking_interaction_active()
	}

	#is_create_form_empty(): boolean {
		return (
			!this.form_title.trim() &&
			!this.form_detail.trim() &&
			this.form_selected_labels.length === 0 &&
			!this.form_due_date &&
			!this.form_rrule
		)
	}

	#commit_pending_label_input(): void {
		if (this.form_label_input.trim()) this.add_label(this.form_label_input)
	}

	#run_deferred_blur_commit(): void {
		if (this.#should_abort_blur_commit()) return

		if (this.#is_create_form_empty()) {
			this.reset_form()
			this.#get_on_dismiss()()

			return
		}

		this.#commit_pending_label_input()
		this.is_blur_submit_pending = true
		this.form_element?.requestSubmit()
	}

	handle_form_focusout(focus_event: FocusEvent): void {
		const related_target = focus_event.relatedTarget
		const related = related_target instanceof Node ? related_target : undefined
		if (dash_task_form_shared.is_focus_still_inside_form(this.form_element, related)) return

		this.clear_blur_commit_timer()

		if (this.is_pointer_held) {
			this.is_blur_deferred_to_pointer_up = true

			return
		}

		this.#blur_commit_timer = globalThis.setTimeout(() => {
			this.#blur_commit_timer = undefined
			this.#run_deferred_blur_commit()
		}, BLUR_COMMIT_DELAY_MS)
	}

	handle_document_pointerdown(): void {
		this.is_pointer_held = true
	}

	handle_document_pointerup(): void {
		this.is_pointer_held = false

		if (!this.is_blur_deferred_to_pointer_up) return

		this.is_blur_deferred_to_pointer_up = false
		globalThis.setTimeout(() => {
			this.#run_deferred_blur_commit()
		}, POINTER_UP_SETTLE_MS)
	}

	handle_document_pointercancel(): void {
		this.is_pointer_held = false
		this.is_blur_deferred_to_pointer_up = false
	}

	handle_document_keydown(key_event: KeyboardEvent): void {
		if (key_event.key !== 'Escape' || key_event.isComposing) return
		if (this.is_dialog_open()) return

		key_event.preventDefault()
		this.reset_form()
		this.close_dialogs()
		this.#get_on_dismiss()()
	}

	handle_enter_submit_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.shiftKey && !key_event.isComposing) {
			key_event.preventDefault()
			this.#try_submit_form()
		}
	}

	open_due_picker(): void {
		const el = this.due_picker_input_el
		if (!el) return

		this.is_date_picker_open = true

		if (typeof el.showPicker === 'function') {
			el.showPicker()
		} else {
			el.click()
		}
	}

	#try_submit_form(): void {
		if (this.is_form_saving || this.#is_create_form_empty()) return

		this.#commit_pending_label_input()
		this.form_element?.requestSubmit()
	}

	async #apply_success_blur_outcome(update: UpdateFn): Promise<void> {
		this.reset_form()
		this.close_dialogs()
		await update({ reset: false })
		this.#get_on_dismiss()()
	}

	async #apply_success_normal_outcome(update: UpdateFn): Promise<void> {
		this.reset_form()
		this.close_dialogs()
		await update({ reset: false })
		await tick()
		this.title_input_el?.focus()
	}

	async #finalize_create_action(result: ActionResult, update: UpdateFn): Promise<void> {
		this.is_form_saving = false
		const did_blur_submit = this.is_blur_submit_pending

		this.is_blur_submit_pending = false

		if (result.type !== 'success') {
			this.create_error = dash_task_form_shared.read_action_error(result)
			await update({ reset: false })

			return
		}

		await (did_blur_submit
			? this.#apply_success_blur_outcome(update)
			: this.#apply_success_normal_outcome(update))
	}

	get_enhance_callback(): () => (input: EnhanceInput) => Promise<void> {
		return () => {
			this.clear_blur_commit_timer()
			this.is_form_saving = true

			return async (input: EnhanceInput) => {
				await this.#finalize_create_action(input.result, input.update)
			}
		}
	}
}
