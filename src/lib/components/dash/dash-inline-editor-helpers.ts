/* eslint-disable unicorn/prefer-dom-node-dataset -- dataset index typing is awkward; markers are fixed */
const ATTR_RR_ENH_GRACE_UNTIL = 'data-dash-rr-enhance-grace-until'
const SELECTOR_DASH_RR_DIALOG = '[data-testid="dash-recurrence-dialog"]'
const SELECTOR_INLINE_TITLE = '[data-testid="dash-inline-title-input"]'
const RR_POST_MODAL_FOCUS_MS = 100

function is_node_inside_add_task_region(node: Node | null): boolean {
	return node instanceof HTMLElement && Boolean(node.closest('[data-dash-add-task-region]'))
}

async function next_animation_frame(): Promise<void> {
	await new Promise<void>((resolve) => {
		globalThis.requestAnimationFrame(() => {
			resolve()
		})
	})
}

function is_live_open_dialog(host: HTMLDialogElement | undefined): boolean {
	return Boolean(host?.isConnected && host.open)
}

function task_form_from_host(host: HTMLElement | undefined): HTMLFormElement | undefined {
	if (host === undefined) return undefined

	const found = host.closest('form')

	return found instanceof HTMLFormElement ? found : undefined
}

function read_rr_dialog_from_dom(
	form_element: HTMLFormElement | undefined,
): HTMLDialogElement | undefined {
	const host = form_element?.querySelector(SELECTOR_DASH_RR_DIALOG)

	return host instanceof HTMLDialogElement ? host : undefined
}

function write_rr_enhance_grace_ms(
	element: HTMLFormElement | undefined,
	duration_ms: number,
): void {
	const expires_at = String(globalThis.performance.now() + duration_ms)

	element?.setAttribute(ATTR_RR_ENH_GRACE_UNTIL, expires_at)
}

function is_rr_enhance_grace_active_on(submit_form: HTMLFormElement): boolean {
	const raw = submit_form.getAttribute(ATTR_RR_ENH_GRACE_UNTIL)
	if (raw === null) return false

	const until = Number(raw)

	return Number.isFinite(until) && globalThis.performance.now() < until
}

function is_rr_dialog_null_focusout(focus_event: FocusEvent): boolean {
	if (focus_event.relatedTarget !== null) return false

	const { target } = focus_event
	if (!(target instanceof Element)) return false

	return target.closest(SELECTOR_DASH_RR_DIALOG) !== null
}

function resolve_title_focus_target(
	title_input_element: HTMLInputElement | undefined,
	form_element: HTMLFormElement | undefined,
): HTMLInputElement | undefined {
	if (title_input_element !== undefined) return title_input_element

	const from_form = form_element?.querySelector(SELECTOR_INLINE_TITLE)

	return from_form instanceof HTMLInputElement ? from_form : undefined
}

function read_task_id_from_title_host(host: HTMLElement): string | undefined {
	const raw_id = (host.getAttribute('data-task-id') ?? '').trim()

	return raw_id === '' ? undefined : raw_id
}

function title_host_from_related(related: HTMLElement): HTMLElement | undefined {
	const host = related.closest('[data-dash-task-title]')

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

	const raw_id = (card.getAttribute('data-dash-task-card') ?? '').trim()

	return raw_id === '' ? undefined : raw_id
}

function is_switching_to_other_task(related: EventTarget | null, task_id: string): boolean {
	const title_id = read_title_switch_task_id(related)
	if (title_id !== undefined && title_id !== task_id) return true

	const card_id = read_card_switch_task_id(related)

	return card_id !== undefined && card_id !== task_id
}

const dash_inline_editor_helpers = {
	is_node_inside_add_task_region,
	next_animation_frame,
	is_live_open_dialog,
	task_form_from_host,
	read_rr_dialog_from_dom,
	write_rr_enhance_grace_ms,
	is_rr_enhance_grace_active_on,
	is_rr_dialog_null_focusout,
	resolve_title_focus_target,
	is_switching_to_other_task,
}

export { ATTR_RR_ENH_GRACE_UNTIL, RR_POST_MODAL_FOCUS_MS, dash_inline_editor_helpers }
