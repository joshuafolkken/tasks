/* eslint-disable unicorn/prevent-abbreviations, sonarjs/void-use, @typescript-eslint/no-floating-promises, promise/catch-or-return, promise/always-return -- DOM measurement and $effect tick scheduling */
import type { PageData, TaskItem } from '$lib/dash-page-types'
import { tick } from 'svelte'
import {
	ATTR_RR_ENH_GRACE_UNTIL,
	dash_inline_editor_helpers,
	RR_POST_MODAL_FOCUS_MS,
} from './dash-inline-editor-helpers'
import { dash_task_form_shared } from './dash-task-form-shared'

const RR_CLOSE_BLUR_GRACE_MS = 2500
const MS_PER_SECOND = 1000
const SECONDS_PER_HOUR = 3600
const RR_OPEN_ENH_BLOCK_MS = SECONDS_PER_HOUR * MS_PER_SECOND
const RR_CLOSE_ENH_CANCEL_MS = 600
/** Right after mount, a sibling editor finishing its in-flight save can trigger a Svelte re-render that
 * momentarily drops browser focus to BODY without removing any DOM node. That spurious focusout is
 * indistinguishable from a legitimate outside-click, so we suppress pristine blur exits for this window. */
const POST_MOUNT_BLUR_GRACE_MS = 500

export class DashInlineEditorBaseState {
	readonly #get_task_item: () => TaskItem
	readonly #get_labels: () => PageData['labels']
	readonly mounted_at_ms: number = globalThis.performance.now()
	form_element = $state<HTMLFormElement | undefined>()
	title_input_el = $state<HTMLInputElement | undefined>()
	detail_textarea_el = $state<HTMLTextAreaElement | undefined>()
	due_picker_input_el = $state<HTMLInputElement | undefined>()
	recurrence_dialog_element = $state<HTMLDialogElement | undefined>()
	is_date_picker_open = $state(false)
	form_title = $state('')
	form_detail = $state('')
	form_label_input = $state('')
	is_form_label_focused = $state(false)
	form_selected_labels = $state<Array<string>>([])
	form_due_date = $state('')
	form_rrule = $state('')
	rrule_draft = $state('')
	recurrence_dialog_mount_key = $state(0)
	is_form_saving = $state(false)
	edit_error = $state<string | undefined>()
	is_blur_commit_pending = $state(false)
	submit_reason = $state<'normal' | 'title_enter_new'>('normal')
	is_pointer_held = $state(false)
	is_blur_deferred_to_pointer_up = $state(false)
	last_seen_focus_request_id = $state(0)
	blur_discard_timer: ReturnType<typeof globalThis.setTimeout> | undefined = undefined
	rr_close_blur_grace_until_ms = 0
	is_rr_dialog_session = false
	is_rr_post_close_submit = false
	is_arrow_nav_discard_active = false
	is_navigating_away = false
	last_seeded_task_id: string | undefined
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

	constructor(get_task_item: () => TaskItem, get_labels: () => PageData['labels']) {
		this.#get_task_item = get_task_item
		this.#get_labels = get_labels

		$effect(() => {
			void this.form_detail
			void this.detail_textarea_el
			tick().then(() => {
				dash_task_form_shared.sync_textarea_height(this.detail_textarea_el)
			})
		})

		$effect(() => {
			return () => {
				this.clear_blur_discard_timer()
				this.is_blur_deferred_to_pointer_up = false
			}
		})

		$effect(() => {
			const { id } = get_task_item()
			if (id === this.last_seeded_task_id) return
			this.last_seeded_task_id = id

			this.sync_form_from_task_item()
			this.#focus_inline_title_at_end()
			tick().then(() => {
				dash_task_form_shared.sync_textarea_height(this.detail_textarea_el)
				this.#focus_inline_title_at_end()
			})
		})
	}

	get_task_item(): TaskItem {
		return this.#get_task_item()
	}

	sync_form_from_task_item(): void {
		const task = this.#get_task_item()

		this.is_blur_commit_pending = false
		this.is_navigating_away = false
		this.form_title = task.title
		this.form_detail = task.detail ?? ''
		this.form_label_input = ''
		this.form_selected_labels = task.task_labels.map((row) => row.label.name)
		this.form_due_date = task.due_date ?? ''
		this.form_rrule = task.recurrence_rule ?? ''
		this.edit_error = undefined
	}

	revert_to_task_item(): void {
		const task = this.#get_task_item()

		this.form_title = task.title
		this.form_detail = task.detail ?? ''
		this.form_label_input = ''
		this.form_selected_labels = task.task_labels.map((row) => row.label.name)
		this.form_due_date = task.due_date ?? ''
		this.form_rrule = task.recurrence_rule ?? ''
		this.edit_error = undefined
	}

	is_form_dirty(): boolean {
		const task = this.#get_task_item()

		return dash_task_form_shared.is_inline_form_dirty(
			{
				title: this.form_title,
				detail: this.form_detail,
				selected_labels: this.form_selected_labels,
				due_date: this.form_due_date,
				rrule: this.form_rrule,
			},
			task,
		)
	}

	is_never_titled_row(): boolean {
		return !this.#get_task_item().title.trim()
	}

	add_label(name: string): void {
		this.form_selected_labels = dash_task_form_shared.apply_add_label(
			this.form_selected_labels,
			name,
		)
		this.form_label_input = ''
	}

	commit_pending_label_input(): void {
		if (this.form_label_input.trim()) this.add_label(this.form_label_input)
	}

	toggle_label_name(name: string): void {
		this.form_selected_labels = dash_task_form_shared.apply_toggle_label(
			this.form_selected_labels,
			name,
		)
	}

	handle_label_keydown(key_event: KeyboardEvent): void {
		if (key_event.key !== 'Enter' || key_event.isComposing) return

		key_event.preventDefault()
		key_event.stopPropagation()

		const host = key_event.currentTarget
		const draft = (host instanceof HTMLInputElement ? host.value : this.form_label_input).trim()
		if (draft) this.add_label(draft)
	}

	clear_blur_discard_timer(): void {
		if (this.blur_discard_timer === undefined) return

		globalThis.clearTimeout(this.blur_discard_timer)
		this.blur_discard_timer = undefined
	}

	is_due_input_focused(): boolean {
		return (
			this.due_picker_input_el !== undefined && document.activeElement === this.due_picker_input_el
		)
	}

	is_blocking_interaction_active(): boolean {
		return this.is_dialog_open() || this.is_form_saving || this.is_date_picker_open
	}

	is_rr_blur_block_active(): boolean {
		if (this.is_rr_dialog_session) return true
		if (globalThis.performance.now() < this.rr_close_blur_grace_until_ms) return true

		return false
	}

	is_in_post_mount_grace(): boolean {
		return globalThis.performance.now() - this.mounted_at_ms < POST_MOUNT_BLUR_GRACE_MS
	}

	is_focus_outside_form(): boolean {
		const active = document.activeElement
		if (active === null) return true
		if (active === document.body) return true

		return this.form_element?.contains(active) !== true
	}

	should_abort_blur_commit(): boolean {
		if (this.is_rr_blur_block_active()) return true
		if (this.form_element?.contains(document.activeElement)) return true
		if (this.is_due_input_focused()) return true

		return this.is_blocking_interaction_active()
	}

	is_dialog_open(): boolean {
		if (dash_inline_editor_helpers.is_live_open_dialog(this.recurrence_dialog_element)) return true

		return dash_inline_editor_helpers.is_live_open_dialog(
			dash_inline_editor_helpers.read_rr_dialog_from_dom(this.form_element),
		)
	}

	close_dialogs(): void {
		this.recurrence_dialog_element?.close()
	}

	#resolve_inline_task_form(anchor?: HTMLElement): HTMLFormElement | undefined {
		const from_anchor = dash_inline_editor_helpers.task_form_from_host(anchor)
		if (from_anchor !== undefined) return from_anchor

		const from_title = dash_inline_editor_helpers.task_form_from_host(this.title_input_el)
		if (from_title !== undefined) return from_title

		const from_dialog = dash_inline_editor_helpers.task_form_from_host(
			this.recurrence_dialog_element,
		)
		if (from_dialog !== undefined) return from_dialog

		return this.form_element
	}

	write_rr_enhance_grace_ms(duration_ms: number, anchor?: HTMLElement): void {
		const el = this.#resolve_inline_task_form(anchor)

		dash_inline_editor_helpers.write_rr_enhance_grace_ms(el, duration_ms)
	}

	open_recurrence_dialog(anchor?: HTMLElement): void {
		this.write_rr_enhance_grace_ms(RR_OPEN_ENH_BLOCK_MS, anchor)
		this.rrule_draft = this.form_rrule
		this.recurrence_dialog_mount_key += 1
		this.is_rr_dialog_session = true
		this.recurrence_dialog_element?.showModal()
	}

	close_rr_dialog_ui(anchor?: HTMLElement): void {
		this.write_rr_enhance_grace_ms(RR_CLOSE_ENH_CANCEL_MS, anchor)
		this.rr_close_blur_grace_until_ms = globalThis.performance.now() + RR_CLOSE_BLUR_GRACE_MS
		this.recurrence_dialog_element?.close()
	}

	submit_dirty_if_rr_idle(): void {
		this.commit_pending_label_input()
		this.clear_blur_discard_timer()

		if (!this.is_form_saving && this.form_title.trim() !== '' && this.is_form_dirty()) {
			this.is_blur_commit_pending = false
			this.submit_reason = 'normal'
			this.is_rr_post_close_submit = true
			this.form_element?.requestSubmit()
		}
	}

	async handle_recurrence_dialog_close(): Promise<void> {
		this.clear_blur_discard_timer()
		this.is_blur_deferred_to_pointer_up = false
		this.form_rrule = this.rrule_draft
		this.write_rr_enhance_grace_ms(RR_CLOSE_ENH_CANCEL_MS)
		this.rr_close_blur_grace_until_ms = globalThis.performance.now() + RR_CLOSE_BLUR_GRACE_MS
		await this.#focus_title_after_rr_close()
		await this.#end_rr_session_clear_enhance()
		await tick()
		await dash_inline_editor_helpers.next_animation_frame()
		this.submit_dirty_if_rr_idle()
	}

	#focus_inline_title_at_end(): void {
		const el = this.title_input_el
		if (!el) return

		el.focus()
		el.setSelectionRange(el.value.length, el.value.length)
	}

	async refocus_title_through_churn(): Promise<void> {
		const target = dash_inline_editor_helpers.resolve_title_focus_target(
			this.title_input_el,
			this.form_element,
		)

		target?.focus()

		await new Promise<void>((resolve) => {
			globalThis.setTimeout(() => {
				dash_inline_editor_helpers
					.resolve_title_focus_target(this.title_input_el, this.form_element)
					?.focus()
				resolve()
			}, 0)
		})

		await new Promise<void>((resolve) => {
			globalThis.setTimeout(() => {
				dash_inline_editor_helpers
					.resolve_title_focus_target(this.title_input_el, this.form_element)
					?.focus()
				resolve()
			}, RR_POST_MODAL_FOCUS_MS)
		})
	}

	async #focus_title_after_rr_close(): Promise<void> {
		await tick()
		await dash_inline_editor_helpers.next_animation_frame()
		await dash_inline_editor_helpers.next_animation_frame()
		await this.refocus_title_through_churn()
		await dash_inline_editor_helpers.next_animation_frame()
	}

	async #end_rr_session_clear_enhance(): Promise<void> {
		this.is_rr_dialog_session = false
		this.rr_close_blur_grace_until_ms = 0
		this.form_element?.removeAttribute(ATTR_RR_ENH_GRACE_UNTIL)
		await tick()
		await dash_inline_editor_helpers.next_animation_frame()
	}
}
