<script lang="ts">
	/* eslint-disable max-lines, max-statements -- mirrors create form for inline edit */
	/* eslint-disable unicorn/prevent-abbreviations, sonarjs/void-use, @typescript-eslint/no-floating-promises, promise/catch-or-return, promise/prefer-await-to-then, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-magic-numbers, unicorn/no-useless-undefined -- DOM measurement, $effect tick scheduling, and mirrored title/detail Enter handlers */
	import type { ActionResult } from '@sveltejs/kit'
	import { enhance } from '$app/forms'
	import RecurrenceInput from '$lib/components/RecurrenceInput.svelte'
	import Spinner from '$lib/components/Spinner.svelte'
	import { dash_display } from '$lib/dash-display'
	import { dash_inline_editor_keyboard } from '$lib/dash-inline-editor-keyboard'
	import type { ActionData, PageData, TaskItem } from '$lib/dash-page-types'
	import { m } from '$lib/paraglide/messages'
	import { rrule_summary } from '$lib/rrule-summary'
	import { tick } from 'svelte'
	import { slide } from 'svelte/transition'

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

	const label_suggestion_limit = 5
	const label_blur_delay_ms = 150
	const blur_commit_delay_ms = 120
	// One frame after pointerup so the click event has already fired before we commit/discard.
	const pointer_up_settle_ms = 16
	const rr_close_blur_grace_ms = 2500
	const MS_PER_SECOND = 1000
	const SECONDS_PER_HOUR = 3600
	/** Block `use:enhance` submits while the recurrence modal is open (Svelte may keep a stale enhance callback). */
	const RR_OPEN_ENH_BLOCK_MS = SECONDS_PER_HOUR * MS_PER_SECOND
	/** Brief window after closing the modal to cancel spurious submits; intentional save can follow soon after. */
	const RR_CLOSE_ENH_CANCEL_MS = 600
	const ATTR_RR_ENH_GRACE_UNTIL = 'data-dash-rr-enhance-grace-until'
	const SELECTOR_DASH_RR_DIALOG = '[data-testid="dash-recurrence-dialog"]'
	const SELECTOR_INLINE_TITLE = '[data-testid="dash-inline-title-input"]'
	/** After `HTMLDialogElement.close()` or `invalidateAll`, focus may be reset after our first `focus()`. */
	const RR_POST_MODAL_FOCUS_MS = 100
	const RRULE_BUTTON_DISPLAY_MAX_CHARS = 48
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
	/** Edited inside the recurrence dialog; merged into `form_rrule` on dialog close only. */
	let rrule_draft = $state('')
	let recurrence_dialog_mount_key = $state(0)
	let is_form_saving = $state(false)
	let edit_error = $state<string | undefined>()
	let recurrence_dialog_element = $state<HTMLDialogElement | undefined>()

	let submit_reason = $state<'normal' | 'title_enter_new'>('normal')
	let blur_discard_timer: ReturnType<typeof globalThis.setTimeout> | undefined = undefined
	let is_blur_commit_pending = $state(false)
	let is_pointer_held = $state(false)
	let is_blur_deferred_to_pointer_up = $state(false)
	let rr_close_blur_grace_until_ms = 0
	/** True from opening the recurrence dialog until close (covers close() vs `open` timing). */
	let is_rr_dialog_session = false
	/** `HTMLDialogElement.open` can stay true for one frame after `close()`; still submit from `onclose`. */
	let is_rr_post_close_submit = false
	/** Prevents the focusout path from triggering a second discard when arrow navigation already handled it. */
	let is_arrow_nav_discard_active = false

	function clear_blur_discard_timer(): void {
		if (blur_discard_timer === undefined) return

		globalThis.clearTimeout(blur_discard_timer)
		blur_discard_timer = undefined
	}

	function is_node_inside_add_task_region(node: Node | null): boolean {
		return node instanceof HTMLElement && Boolean(node.closest('[data-dash-add-task-region]'))
	}

	function blur_effect_cleanup(): void {
		clear_blur_discard_timer()
		is_blur_deferred_to_pointer_up = false
	}

	const label_sort_compare = (left: string, right: string): number => left.localeCompare(right)

	function is_never_titled_row(): boolean {
		return !task_item.title.trim()
	}

	function sorted_label_names_from_task(): Array<string> {
		return task_item.task_labels.map((row) => row.label.name).toSorted(label_sort_compare)
	}

	function sorted_label_names_from_form(): Array<string> {
		return [...form_selected_labels]
			.map((name) => name.trim())
			.filter(Boolean)
			.toSorted(label_sort_compare)
	}

	function is_label_set_changed(): boolean {
		return sorted_label_names_from_form().join('\0') !== sorted_label_names_from_task().join('\0')
	}

	function is_text_fields_changed(): boolean {
		return (
			form_title.trim() !== task_item.title.trim() ||
			form_detail.trim() !== (task_item.detail ?? '').trim()
		)
	}

	function is_schedule_changed(): boolean {
		return (
			form_due_date !== (task_item.due_date ?? '') ||
			form_rrule !== (task_item.recurrence_rule ?? '')
		)
	}

	function is_form_dirty(): boolean {
		return is_text_fields_changed() || is_label_set_changed() || is_schedule_changed()
	}

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
		return blur_effect_cleanup
	})

	let last_seen_focus_request_id = $state(0)

	let last_seeded_task_id = $state<string | undefined>(undefined)

	function focus_inline_title_at_end(): void {
		const el = title_input_el
		if (!el) return

		el.focus()
		el.setSelectionRange(el.value.length, el.value.length)
	}

	function sync_form_from_task_item(): void {
		is_blur_commit_pending = false
		form_title = task_item.title
		form_detail = task_item.detail ?? ''
		form_label_input = ''
		form_selected_labels = task_item.task_labels.map((row) => row.label.name)
		form_due_date = task_item.due_date ?? ''
		form_rrule = task_item.recurrence_rule ?? ''
		edit_error = undefined
	}

	$effect(() => {
		const { id } = task_item
		if (id === last_seeded_task_id) return
		last_seeded_task_id = id

		sync_form_from_task_item()
		focus_inline_title_at_end()
		tick().then(() => {
			sync_detail_height()
			focus_inline_title_at_end()

			return undefined
		})
	})

	function add_label(name: string): void {
		const trimmed = name.trim()

		if (trimmed && !form_selected_labels.includes(trimmed)) {
			form_selected_labels = [...form_selected_labels, trimmed]
		}

		form_label_input = ''
	}

	function commit_pending_label_input(): void {
		if (form_label_input.trim()) add_label(form_label_input)
	}

	function toggle_label_name(name: string): void {
		form_selected_labels = form_selected_labels.includes(name)
			? form_selected_labels.filter((label_name) => label_name !== name)
			: [...form_selected_labels, name]
	}

	function read_label_input_value(key_event: KeyboardEvent): string {
		const host = key_event.currentTarget

		return host instanceof HTMLInputElement ? host.value : form_label_input
	}

	function handle_label_keydown(key_event: KeyboardEvent): void {
		if (key_event.key === 'Enter' && !key_event.isComposing) {
			key_event.preventDefault()
			key_event.stopPropagation()
			const draft = read_label_input_value(key_event).trim()
			if (draft) add_label(draft)
		}
	}

	function revert_to_task_item(): void {
		form_title = task_item.title
		form_detail = task_item.detail ?? ''
		form_label_input = ''
		form_selected_labels = task_item.task_labels.map((row) => row.label.name)
		form_due_date = task_item.due_date ?? ''
		form_rrule = task_item.recurrence_rule ?? ''
		edit_error = undefined
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

		edit_error = read_optional_string_field(result.data, 'error') ?? m.dash_create_error_default()
	}

	function read_rr_dialog_from_dom(): HTMLDialogElement | undefined {
		const host = form_element?.querySelector(SELECTOR_DASH_RR_DIALOG)

		return host instanceof HTMLDialogElement ? host : undefined
	}

	function task_form_from_host(host: HTMLElement | undefined): HTMLFormElement | undefined {
		if (host === undefined) return undefined

		const found = host.closest('form')

		return found instanceof HTMLFormElement ? found : undefined
	}

	function resolve_inline_task_form(anchor?: HTMLElement): HTMLFormElement | undefined {
		const from_anchor = task_form_from_host(anchor)
		if (from_anchor !== undefined) return from_anchor

		const from_title = task_form_from_host(title_input_el)
		if (from_title !== undefined) return from_title

		const from_dialog = task_form_from_host(recurrence_dialog_element)
		if (from_dialog !== undefined) return from_dialog

		return form_element
	}

	function write_rr_enhance_grace_ms(duration_ms: number, anchor?: HTMLElement): void {
		const el = resolve_inline_task_form(anchor)
		if (el === undefined) return

		el.setAttribute(ATTR_RR_ENH_GRACE_UNTIL, String(globalThis.performance.now() + duration_ms))
	}

	function is_rr_enhance_grace_active_on(submit_form: HTMLFormElement): boolean {
		const raw = submit_form.getAttribute(ATTR_RR_ENH_GRACE_UNTIL)
		if (raw === null) return false

		const until = Number(raw)

		return Number.isFinite(until) && globalThis.performance.now() < until
	}

	function is_live_open_dialog(host: HTMLDialogElement | undefined): boolean {
		return Boolean(host?.isConnected && host.open)
	}

	function is_dialog_open(): boolean {
		if (is_live_open_dialog(recurrence_dialog_element)) return true

		return is_live_open_dialog(read_rr_dialog_from_dom())
	}

	function is_focus_still_inside_form(related: Node | null): boolean {
		return related !== null && Boolean(form_element?.contains(related))
	}

	function is_rr_dialog_null_focusout(focus_event: FocusEvent): boolean {
		if (focus_event.relatedTarget !== null) return false
		const { target } = focus_event
		if (!(target instanceof Element)) return false

		return target.closest(SELECTOR_DASH_RR_DIALOG) !== null
	}

	function should_skip_form_focusout(focus_event: FocusEvent): boolean {
		if (is_focus_still_inside_form(focus_event.relatedTarget as Node | null)) return true
		if (is_rr_dialog_null_focusout(focus_event)) return true
		if (globalThis.performance.now() < rr_close_blur_grace_until_ms) return true
		if (is_rr_dialog_session) return true

		return false
	}

	async function next_animation_frame(): Promise<void> {
		await new Promise<void>((resolve) => {
			globalThis.requestAnimationFrame(() => {
				resolve()
			})
		})
	}

	function open_recurrence_dialog(anchor?: HTMLElement): void {
		write_rr_enhance_grace_ms(RR_OPEN_ENH_BLOCK_MS, anchor)
		rrule_draft = form_rrule
		recurrence_dialog_mount_key += 1
		is_rr_dialog_session = true
		recurrence_dialog_element?.showModal()
	}

	function close_rr_dialog_ui(anchor?: HTMLElement): void {
		write_rr_enhance_grace_ms(RR_CLOSE_ENH_CANCEL_MS, anchor)
		rr_close_blur_grace_until_ms = globalThis.performance.now() + rr_close_blur_grace_ms
		recurrence_dialog_element?.close()
	}

	function resolve_title_focus_target(): HTMLInputElement | undefined {
		if (title_input_el !== undefined) return title_input_el

		const from_form = form_element?.querySelector(SELECTOR_INLINE_TITLE)

		return from_form instanceof HTMLInputElement ? from_form : undefined
	}

	async function refocus_title_through_churn(): Promise<void> {
		resolve_title_focus_target()?.focus()
		await new Promise<void>((resolve) => {
			globalThis.setTimeout(() => {
				resolve_title_focus_target()?.focus()
				resolve()
			}, 0)
		})
		await new Promise<void>((resolve) => {
			globalThis.setTimeout(() => {
				resolve_title_focus_target()?.focus()
				resolve()
			}, RR_POST_MODAL_FOCUS_MS)
		})
	}

	$effect(() => {
		if (focus_request_id <= last_seen_focus_request_id) return

		last_seen_focus_request_id = focus_request_id

		void (async () => {
			await tick()
			await tick()
			await next_animation_frame()
			const title_el = resolve_title_focus_target()

			if (title_el) {
				title_el.focus()
				title_el.setSelectionRange(title_el.value.length, title_el.value.length)
			}
		})()
	})

	async function focus_title_after_rr_close(): Promise<void> {
		await tick()
		await next_animation_frame()
		await next_animation_frame()
		await refocus_title_through_churn()
		await next_animation_frame()
	}

	async function end_rr_session_clear_enhance(): Promise<void> {
		is_rr_dialog_session = false
		rr_close_blur_grace_until_ms = 0
		form_element?.removeAttribute(ATTR_RR_ENH_GRACE_UNTIL)
		await tick()
		await next_animation_frame()
	}

	function submit_dirty_if_rr_idle(): void {
		commit_pending_label_input()
		clear_blur_discard_timer()

		if (!is_form_saving && form_title.trim() !== '' && is_form_dirty()) {
			is_blur_commit_pending = false
			submit_reason = 'normal'
			is_rr_post_close_submit = true
			form_element?.requestSubmit()
		}
	}

	async function handle_recurrence_dialog_close(): Promise<void> {
		/* Dialog close uses pointerdown/up; drop stale deferred blur before refocus + submit. */
		clear_blur_discard_timer()
		is_blur_deferred_to_pointer_up = false
		form_rrule = rrule_draft
		write_rr_enhance_grace_ms(RR_CLOSE_ENH_CANCEL_MS)
		rr_close_blur_grace_until_ms = globalThis.performance.now() + rr_close_blur_grace_ms
		await focus_title_after_rr_close()
		await end_rr_session_clear_enhance()
		await tick()
		await next_animation_frame()
		submit_dirty_if_rr_idle()
	}

	function is_due_input_focused(): boolean {
		return due_picker_input_el !== undefined && document.activeElement === due_picker_input_el
	}

	function is_blocking_interaction_active(): boolean {
		return is_dialog_open() || is_form_saving || is_date_picker_open
	}

	function is_rr_blur_block_active(): boolean {
		if (is_rr_dialog_session) return true
		if (globalThis.performance.now() < rr_close_blur_grace_until_ms) return true

		return false
	}

	function should_abort_blur_commit(): boolean {
		if (is_rr_blur_block_active()) return true
		if (form_element?.contains(document.activeElement)) return true
		if (is_due_input_focused()) return true

		return is_blocking_interaction_active()
	}

	function read_task_id_from_title_host(host: HTMLElement): string | undefined {
		/* eslint-disable-next-line unicorn/prefer-dom-node-dataset -- `dataset` index typing is awkward; marker is fixed. */
		const raw_id = (host.getAttribute('data-task-id') ?? '').trim()

		return raw_id === '' ? undefined : raw_id
	}

	function title_host_from_related(related: HTMLElement): HTMLElement | undefined {
		const host = related.closest('[data-dash-task-title]')
		if (host === null) return undefined

		return host instanceof HTMLElement ? host : undefined
	}

	function read_title_switch_task_id(related: EventTarget | null): string | undefined {
		if (!(related instanceof HTMLElement)) return undefined

		const host = title_host_from_related(related)
		if (host === undefined) return undefined

		return read_task_id_from_title_host(host)
	}

	function read_card_switch_task_id(related: EventTarget | null): string | undefined {
		if (!(related instanceof HTMLElement)) return undefined

		const card = related.closest('[data-dash-task-card]')
		if (!(card instanceof HTMLElement)) return undefined

		/* eslint-disable-next-line unicorn/prefer-dom-node-dataset -- same reason as title host */
		const raw_id = (card.getAttribute('data-dash-task-card') ?? '').trim()

		return raw_id === '' ? undefined : raw_id
	}

	function is_switching_to_other_task(related: EventTarget | null): boolean {
		const title_id = read_title_switch_task_id(related)
		if (title_id !== undefined && title_id !== task_item.id) return true

		const card_id = read_card_switch_task_id(related)

		return card_id !== undefined && card_id !== task_item.id
	}

	async function run_discard_empty_animated(): Promise<void> {
		if (on_try_discard_empty === undefined) return
		await on_try_discard_empty()
	}

	async function apply_empty_blur_outcome(): Promise<void> {
		if (is_node_inside_add_task_region(document.activeElement)) return
		if (is_arrow_nav_discard_active) return

		await run_discard_empty_animated()
	}

	function apply_dirty_blur_submit(): void {
		if (is_rr_blur_block_active()) return

		commit_pending_label_input()
		is_blur_commit_pending = true
		submit_reason = 'normal'
		form_element?.requestSubmit()
	}

	async function commit_blur_when_title_missing(): Promise<void> {
		if (!is_never_titled_row()) {
			revert_to_task_item()

			return
		}

		await apply_empty_blur_outcome()
	}

	async function run_deferred_blur_commit(): Promise<void> {
		if (should_abort_blur_commit()) return

		if (!form_title.trim()) {
			await commit_blur_when_title_missing()

			return
		}

		if (!is_form_dirty()) {
			/* Pristine outside-click used to call `on_escape()`, but focus churn during save
			 * (recurrence / due / invalidate) triggers the same deferred path spuriously. */
			return
		}

		apply_dirty_blur_submit()
	}

	function handle_form_focusout(focus_event: FocusEvent): void {
		if (should_skip_form_focusout(focus_event)) return

		clear_blur_discard_timer()

		// Delay until pointerup so the row does not vanish on mousedown;
		// the click event will complete normally before the editor closes.
		if (is_pointer_held) {
			is_blur_deferred_to_pointer_up = true

			return
		}

		const delay_ms = is_switching_to_other_task(focus_event.relatedTarget)
			? 0
			: blur_commit_delay_ms

		blur_discard_timer = globalThis.setTimeout(() => {
			blur_discard_timer = undefined
			void run_deferred_blur_commit()
		}, delay_ms)
	}

	function handle_document_pointerdown(): void {
		is_pointer_held = true
	}

	async function handle_document_pointerup(): Promise<void> {
		is_pointer_held = false

		if (!is_blur_deferred_to_pointer_up) return

		is_blur_deferred_to_pointer_up = false
		await new Promise((resolve) => {
			globalThis.setTimeout(resolve, pointer_up_settle_ms)
		})
		await run_deferred_blur_commit()
	}

	function handle_document_pointercancel(): void {
		is_pointer_held = false
		is_blur_deferred_to_pointer_up = false
	}

	function is_escape_suppressed_by_modal(): boolean {
		/* Blur still uses `is_rr_dialog_session`; Escape must work as soon as the dialog is gone
		 * (post-close focus runs async and would otherwise swallow Escape until session ends). */
		return is_dialog_open()
	}

	function should_discard_on_escape(): boolean {
		return !form_title.trim() && is_never_titled_row()
	}

	function finalize_standard_escape(): void {
		revert_to_task_item()
		on_escape()
	}

	function apply_escape_key_outcome(): void {
		close_dialogs()

		if (should_discard_on_escape()) {
			void on_try_discard_empty?.()

			return
		}

		finalize_standard_escape()
	}

	function handle_document_keydown(key_event: KeyboardEvent): void {
		if (key_event.key !== 'Escape' || key_event.isComposing) return
		if (is_escape_suppressed_by_modal()) return

		key_event.preventDefault()
		apply_escape_key_outcome()
	}

	function try_submit_form(): void {
		if (is_rr_blur_block_active()) return
		if (is_form_saving || form_title.trim() === '') return

		commit_pending_label_input()
		clear_blur_discard_timer()
		is_blur_commit_pending = false
		submit_reason = 'normal'

		form_element?.requestSubmit()
	}

	function is_plain_enter_key(key_event: KeyboardEvent): boolean {
		return key_event.key === 'Enter' && !key_event.shiftKey && !key_event.isComposing
	}

	function handle_arrow_without_title(direction: 'up' | 'down'): void {
		if (!is_never_titled_row()) revert_to_task_item()

		on_navigate_arrow?.(direction)

		if (is_never_titled_row()) {
			is_arrow_nav_discard_active = true
			void on_try_discard_empty?.()
		}
	}

	function handle_arrow_with_title(direction: 'up' | 'down'): void {
		if (is_form_dirty()) try_submit_form()

		on_navigate_arrow?.(direction)
	}

	function handle_arrow_navigation(key_event: KeyboardEvent): void {
		if (key_event.isComposing) return

		const direction = dash_inline_editor_keyboard.read_vertical_arrow_direction(key_event)
		if (direction === undefined) return

		key_event.preventDefault()

		if (!form_title.trim()) {
			handle_arrow_without_title(direction)

			return
		}

		handle_arrow_with_title(direction)
	}

	function handle_title_enter_confirm(key_event: KeyboardEvent): void {
		key_event.preventDefault()
		if (is_rr_blur_block_active()) return
		if (is_form_saving) return
		if (!form_title.trim()) return

		clear_blur_discard_timer()
		is_blur_commit_pending = false
		submit_reason = 'title_enter_new'
		form_element?.requestSubmit()
	}

	function handle_title_keydown(key_event: KeyboardEvent): void {
		if (dash_inline_editor_keyboard.read_vertical_arrow_direction(key_event) !== undefined) {
			handle_arrow_navigation(key_event)

			return
		}

		if (!is_plain_enter_key(key_event)) return

		handle_title_enter_confirm(key_event)
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

	function is_title_enter_chain(reason: 'normal' | 'title_enter_new'): boolean {
		return reason === 'title_enter_new' && on_title_enter_saved !== undefined
	}

	function is_blur_commit_exit(
		reason: 'normal' | 'title_enter_new',
		is_saved_via_blur_commit: boolean,
	): boolean {
		return reason === 'normal' && is_saved_via_blur_commit && on_blur_commit_saved !== undefined
	}

	async function run_after_successful_update(
		reason: 'normal' | 'title_enter_new',
		is_saved_via_blur_commit: boolean,
	): Promise<void> {
		if (is_title_enter_chain(reason)) {
			await on_title_enter_saved?.()

			return
		}

		if (is_blur_commit_exit(reason, is_saved_via_blur_commit)) {
			await on_blur_commit_saved?.()

			return
		}

		await on_saved()
	}

	function reset_blur_defer_flags(): void {
		clear_blur_discard_timer()
		is_blur_deferred_to_pointer_up = false
	}

	async function finalize_success_then_refocus(
		reason: 'normal' | 'title_enter_new',
		is_saved_via_blur_commit: boolean,
		update: (options?: { reset?: boolean }) => Promise<void>,
	): Promise<void> {
		close_dialogs()
		edit_error = undefined
		is_blur_commit_pending = false
		reset_blur_defer_flags()
		await update({ reset: false })
		reset_blur_defer_flags()
		/* Same task id skips the seed $effect; align with load data so normalized fields (e.g. rrule) are not left dirty. */
		await tick()
		sync_form_from_task_item()
		await run_after_successful_update(reason, is_saved_via_blur_commit)
		reset_blur_defer_flags()

		if (!is_blur_commit_exit(reason, is_saved_via_blur_commit)) {
			await tick()
			await next_animation_frame()
			await next_animation_frame()
			await refocus_title_through_churn()
		}
	}

	async function finalize_update_action(
		result: ActionResult,
		update: (options?: { reset?: boolean }) => Promise<void>,
	): Promise<void> {
		is_form_saving = false
		const reason = submit_reason

		submit_reason = 'normal'

		if (result.type === 'success') {
			const is_saved_via_blur_commit = is_blur_commit_pending

			await finalize_success_then_refocus(reason, is_saved_via_blur_commit, update)

			return
		}

		is_blur_commit_pending = false
		apply_failure_error_message(result)
		await update({ reset: false })
	}

	async function handle_update_enhance_result(input: {
		result: ActionResult
		update: (options?: { reset?: boolean }) => Promise<void>
	}): Promise<void> {
		await finalize_update_action(input.result, input.update)
	}
</script>

<svelte:window onkeydown={handle_document_keydown} />
<svelte:document
	onpointerdown={handle_document_pointerdown}
	onpointerup={handle_document_pointerup}
	onpointercancel={handle_document_pointercancel}
/>

<div transition:slide|global={{ duration: 200, axis: 'y' }}>
	<div class="-m-1 overflow-hidden p-1">
		<form
			bind:this={form_element}
			method="POST"
			action="?/update_task"
			use:enhance={(submission) => {
				if (is_rr_enhance_grace_active_on(submission.formElement)) {
					submission.cancel()

					return handle_update_enhance_result
				}

				if (is_rr_blur_block_active()) {
					submission.cancel()

					return handle_update_enhance_result
				}

				const is_dialog_submit_exempt = is_rr_post_close_submit

				if (is_dialog_open() && !is_dialog_submit_exempt) {
					submission.cancel()

					return handle_update_enhance_result
				}

				is_rr_post_close_submit = false
				submission.formElement.removeAttribute(ATTR_RR_ENH_GRACE_UNTIL)
				clear_blur_discard_timer()
				is_form_saving = true

				return handle_update_enhance_result
			}}
			class="relative min-w-0 flex-1 space-y-1.5"
			onfocusout={handle_form_focusout}
		>
			<input type="hidden" name="task_id" value={task_item.id} />

			{#if is_form_saving}
				<div
					class="absolute inset-e-0 top-0 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"
				>
					<Spinner size="sm" variant="dark" />
					{m.dash_create_saving()}
				</div>
			{/if}

			<input
				bind:this={title_input_el}
				type="text"
				name="title"
				data-testid="dash-inline-title-input"
				bind:value={form_title}
				placeholder={m.dash_create_title_placeholder()}
				class={input_class}
				onkeydown={handle_title_keydown}
			/>

			<textarea
				bind:this={detail_textarea_el}
				name="detail"
				data-testid="dash-inline-detail-input"
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
						data-testid="dash-inline-label-input"
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
						data-testid="dash-inline-recurrence-button"
						onclick={(mouse_event) => {
							open_recurrence_dialog(
								mouse_event.currentTarget instanceof HTMLElement
									? mouse_event.currentTarget
									: undefined,
							)
						}}
						class="rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700/80"
					>
						{recurrence_edit_button_text}
					</button>
				{:else}
					<button
						type="button"
						onclick={(mouse_event) => {
							open_recurrence_dialog(
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
				bind:this={recurrence_dialog_element}
				data-testid="dash-recurrence-dialog"
				class={dialog_recurrence_class}
				onclose={handle_recurrence_dialog_close}
			>
				<h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
					{m.dash_create_recurrence_dialog_title()}
				</h2>
				{#key recurrence_dialog_mount_key}
					{#if recurrence_dialog_mount_key > 0}
						<RecurrenceInput bind:value={rrule_draft} />
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
							close_rr_dialog_ui(
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

			{#if edit_error}
				<p class="text-sm text-red-500">{edit_error}</p>
			{/if}
			{#if form?.error}
				<p class="text-sm text-red-500">{form.error}</p>
			{/if}

			<button type="button" class="sr-only" tabindex={-1} aria-hidden="true">submit</button>
		</form>
	</div>
</div>
