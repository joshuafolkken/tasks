/* eslint-disable unicorn/prevent-abbreviations -- DOM measurement and $effect tick scheduling */
import type { ActionResult, SubmitFunction } from '@sveltejs/kit'
import { dash_inline_editor_keyboard } from '$lib/dash-inline-editor-keyboard'
import type { PageData, TaskItem } from '$lib/dash-page-types'
import { tick } from 'svelte'
import { ATTR_RR_ENH_GRACE_UNTIL, dash_inline_editor_helpers } from './dash-inline-editor-helpers'
import {
	BLUR_COMMIT_DELAY_MS,
	dash_task_form_shared,
	POINTER_UP_SETTLE_MS,
} from './dash-task-form-shared'
import { DashInlineEditorBaseState } from './DashInlineEditorBaseState.svelte'

type UpdateFn = (options?: { reset?: boolean }) => Promise<void>

interface EditorCallbackGetters {
	get_on_escape: () => () => void
	get_on_saved: () => () => Promise<void>
	get_on_blur_commit_saved: () => (() => Promise<void>) | undefined
	get_on_title_enter_saved: () => (() => Promise<void>) | undefined
	get_on_try_discard_empty: () => (() => Promise<void>) | undefined
	get_on_navigate_arrow: () => ((direction: 'up' | 'down') => void) | undefined
}

export class DashInlineEditorState extends DashInlineEditorBaseState {
	readonly #cbs: EditorCallbackGetters

	constructor(
		get_task_item: () => TaskItem,
		get_labels: () => PageData['labels'],
		callbacks: EditorCallbackGetters,
	) {
		super(get_task_item, get_labels)
		this.#cbs = callbacks
	}

	handle_form_focusout(focus_event: FocusEvent): void {
		if (this.#should_skip_form_focusout(focus_event)) return

		this.clear_blur_discard_timer()

		if (this.is_pointer_held) {
			this.is_blur_deferred_to_pointer_up = true

			return
		}

		const delay_ms = dash_inline_editor_helpers.is_switching_to_other_task(
			focus_event.relatedTarget,
			this.get_task_item().id,
		)
			? 0
			: BLUR_COMMIT_DELAY_MS

		this.blur_discard_timer = globalThis.setTimeout(() => {
			this.blur_discard_timer = undefined
			void this.#run_deferred_blur_commit()
		}, delay_ms)
	}

	handle_document_pointerdown(): void {
		this.is_pointer_held = true
	}

	async handle_document_pointerup(): Promise<void> {
		this.is_pointer_held = false

		if (!this.is_blur_deferred_to_pointer_up) return

		this.is_blur_deferred_to_pointer_up = false
		await new Promise((resolve) => {
			globalThis.setTimeout(resolve, POINTER_UP_SETTLE_MS)
		})
		await this.#run_deferred_blur_commit()
	}

	handle_document_pointercancel(): void {
		this.is_pointer_held = false
		this.is_blur_deferred_to_pointer_up = false
	}

	handle_document_keydown(key_event: KeyboardEvent): void {
		if (key_event.key !== 'Escape' || key_event.isComposing) return
		if (this.is_dialog_open()) return

		key_event.preventDefault()
		this.#apply_escape_key_outcome()
	}

	handle_title_keydown(key_event: KeyboardEvent): void {
		if (dash_inline_editor_keyboard.read_vertical_arrow_direction(key_event) !== undefined) {
			this.#handle_arrow_navigation(key_event)

			return
		}

		if (key_event.key !== 'Enter' || key_event.shiftKey || key_event.isComposing) return

		this.#handle_title_enter_confirm(key_event)
	}

	handle_detail_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.shiftKey && !key_event.isComposing) {
			key_event.preventDefault()
			this.#try_submit_form()
		}
	}

	open_due_picker(): void {
		const picker = this.due_picker_input_el
		if (!picker) return

		this.is_date_picker_open = true

		if (typeof picker.showPicker === 'function') {
			picker.showPicker()
		} else {
			picker.click()
		}
	}

	get_enhance_callback(): SubmitFunction {
		return (submission) => {
			const { formElement: form_element, cancel } = submission
			const should_cancel =
				dash_inline_editor_helpers.is_rr_enhance_grace_active_on(form_element) ||
				this.is_rr_blur_block_active() ||
				(this.is_dialog_open() && !this.is_rr_post_close_submit)

			if (should_cancel) {
				cancel()
			} else {
				this.is_rr_post_close_submit = false
				form_element.removeAttribute(ATTR_RR_ENH_GRACE_UNTIL)
				this.clear_blur_discard_timer()
				this.is_form_saving = true
			}

			return this.#handle_update_enhance_result.bind(this)
		}
	}

	#should_skip_form_focusout(focus_event: FocusEvent): boolean {
		const related_target = focus_event.relatedTarget
		const related = related_target instanceof Node ? related_target : undefined
		if (dash_task_form_shared.is_focus_still_inside_form(this.form_element, related)) return true
		if (dash_inline_editor_helpers.is_rr_dialog_null_focusout(focus_event)) return true
		if (globalThis.performance.now() < this.rr_close_blur_grace_until_ms) return true

		return this.is_rr_dialog_session
	}

	async #run_deferred_blur_commit(): Promise<void> {
		if (this.should_abort_blur_commit()) return
		if (this.is_navigating_away) return

		if (!this.form_title.trim()) {
			await this.#commit_blur_when_title_missing()

			return
		}

		if (this.is_form_dirty()) {
			this.#apply_dirty_blur_submit()

			return
		}

		this.#cbs.get_on_escape()()
	}

	async #commit_blur_when_title_missing(): Promise<void> {
		if (!this.is_never_titled_row()) {
			this.revert_to_task_item()

			return
		}

		await this.#apply_empty_blur_outcome()
	}

	#apply_dirty_blur_submit(): void {
		if (this.is_rr_blur_block_active()) return

		this.commit_pending_label_input()
		this.is_blur_commit_pending = true
		this.submit_reason = 'normal'
		this.form_element?.requestSubmit()
	}

	async #apply_empty_blur_outcome(): Promise<void> {
		if (dash_inline_editor_helpers.is_node_inside_add_task_region(document.activeElement)) return
		if (this.is_arrow_nav_discard_active) return

		const discard = this.#cbs.get_on_try_discard_empty()
		if (discard !== undefined) await discard()
	}

	#apply_escape_key_outcome(): void {
		this.close_dialogs()

		const should_discard = !this.form_title.trim() && this.is_never_titled_row()

		if (should_discard) {
			void this.#cbs.get_on_try_discard_empty()?.()

			return
		}

		this.revert_to_task_item()
		this.#cbs.get_on_escape()()
	}

	#try_submit_form(): void {
		if (this.is_rr_blur_block_active()) return
		if (this.is_form_saving || this.form_title.trim() === '') return

		this.commit_pending_label_input()
		this.clear_blur_discard_timer()
		this.is_blur_commit_pending = false
		this.submit_reason = 'normal'
		this.form_element?.requestSubmit()
	}

	#handle_title_enter_confirm(key_event: KeyboardEvent): void {
		key_event.preventDefault()
		if (this.is_rr_blur_block_active() || this.is_form_saving || !this.form_title.trim()) return

		this.clear_blur_discard_timer()
		this.is_blur_commit_pending = false
		this.submit_reason = 'title_enter_new'
		this.form_element?.requestSubmit()
	}

	#handle_arrow_navigation(key_event: KeyboardEvent): void {
		if (key_event.isComposing) return

		const direction = dash_inline_editor_keyboard.read_vertical_arrow_direction(key_event)
		if (direction === undefined) return

		key_event.preventDefault()

		if (this.form_title.trim()) {
			this.#handle_arrow_with_title(direction)
		} else {
			this.#handle_arrow_without_title(direction)
		}
	}

	#handle_arrow_without_title(direction: 'up' | 'down'): void {
		if (!this.is_never_titled_row()) this.revert_to_task_item()

		this.is_navigating_away = true
		this.#cbs.get_on_navigate_arrow()?.(direction)

		if (this.is_never_titled_row()) {
			this.is_arrow_nav_discard_active = true
			void this.#cbs.get_on_try_discard_empty()?.()
		}
	}

	#handle_arrow_with_title(direction: 'up' | 'down'): void {
		if (this.is_form_dirty()) this.#try_submit_form()

		this.is_navigating_away = true
		this.#cbs.get_on_navigate_arrow()?.(direction)
	}

	async #handle_update_enhance_result(input: {
		result: ActionResult
		update: UpdateFn
	}): Promise<void> {
		this.is_form_saving = false

		const reason = this.submit_reason

		this.submit_reason = 'normal'

		if (input.result.type === 'success') {
			const is_saved_via_blur_commit = this.is_blur_commit_pending

			await this.#finalize_success_then_refocus(reason, is_saved_via_blur_commit, input.update)

			return
		}

		this.is_blur_commit_pending = false
		this.edit_error = dash_task_form_shared.read_action_error(input.result)
		await input.update({ reset: false })
	}

	async #finalize_success_then_refocus(
		reason: 'normal' | 'title_enter_new',
		is_saved_via_blur_commit: boolean,
		update: UpdateFn,
	): Promise<void> {
		this.close_dialogs()
		this.edit_error = undefined
		this.is_blur_commit_pending = false
		this.#reset_blur_defer_flags()
		await update({ reset: false })
		await tick()

		const did_navigate_away = this.is_navigating_away

		this.sync_form_from_task_item()
		await this.#run_after_successful_update(reason, is_saved_via_blur_commit)
		await this.#maybe_refocus_title(reason, is_saved_via_blur_commit, did_navigate_away)
		this.#reset_blur_defer_flags()
	}

	async #run_after_successful_update(
		reason: 'normal' | 'title_enter_new',
		is_saved_via_blur_commit: boolean,
	): Promise<void> {
		if (reason === 'title_enter_new') {
			await this.#cbs.get_on_title_enter_saved()?.()

			return
		}

		if (is_saved_via_blur_commit) {
			const on_blur = this.#cbs.get_on_blur_commit_saved()

			if (on_blur !== undefined) {
				await on_blur()

				return
			}
		}

		await this.#cbs.get_on_saved()()
	}

	async #maybe_refocus_title(
		reason: 'normal' | 'title_enter_new',
		is_saved_via_blur_commit: boolean,
		did_navigate_away: boolean,
	): Promise<void> {
		const is_blur_exit =
			reason === 'normal' &&
			is_saved_via_blur_commit &&
			this.#cbs.get_on_blur_commit_saved() !== undefined

		if (is_blur_exit || did_navigate_away) return

		await tick()
		await dash_inline_editor_helpers.next_animation_frame()
		await dash_inline_editor_helpers.next_animation_frame()
		await this.refocus_title_through_churn()
	}

	#reset_blur_defer_flags(): void {
		this.clear_blur_discard_timer()
		this.is_blur_deferred_to_pointer_up = false
	}
}
