<script lang="ts">
	import { deserialize } from '$app/forms'
	import { invalidateAll } from '$app/navigation'
	import { page } from '$app/state'
	import CenteredPageWithHeader from '$lib/components/CenteredPageWithHeader.svelte'
	import DashSearchBar from '$lib/components/dash/DashSearchBar.svelte'
	import DashTasksPanel from '$lib/components/dash/DashTasksPanel.svelte'
	import { dash_action_result } from '$lib/dash-action-result'
	import { dash_fetch } from '$lib/dash-fetch'
	import { dash_reorder_client } from '$lib/dash-reorder-client'
	import { dash_task_filters } from '$lib/dash-task-filters'
	import { DASH_PAGE_UI } from '$lib/dash-ui'
	import { m } from '$lib/paraglide/messages'
	import { tick } from 'svelte'
	import type { ActionData, PageData } from './$types'
	import type { TaskItem } from './dash-page-types'

	interface Props {
		data: PageData
		form: ActionData
	}

	const { data, form }: Props = $props()

	/** `use:enhance` と同様。無いと action の応答が HTML になり `deserialize` で `task_id` 等を読めない。 */
	const json_action_headers: HeadersInit = {
		accept: 'application/json',
		'x-sveltekit-action': 'true',
	}

	/* eslint-disable svelte/prefer-writable-derived -- tasks_state: optimistic complete/delete + resync from load after invalidate */
	let tasks_state = $state<Array<TaskItem>>([])

	$effect(() => {
		tasks_state = [...data.tasks]
	})
	/* eslint-enable svelte/prefer-writable-derived */

	let search_query = $state('')
	let selected_label_ids = $state<Array<string>>([])
	let filter_mode = $state<'one' | 'and' | 'or'>('one')

	const has_filter = $derived(search_query.trim() !== '' || selected_label_ids.length > 0)

	function task_order_signature(items: ReadonlyArray<TaskItem>): string {
		return items.map((row) => row.id).join('\0')
	}

	async function reorder_commit(dragged_id: string, insert_before_id?: string): Promise<void> {
		const next =
			insert_before_id === undefined
				? dash_reorder_client.move_task_to_end(tasks_state, dragged_id)
				: dash_reorder_client.reorder_with_insert_before(tasks_state, dragged_id, insert_before_id)

		if (task_order_signature(next) === task_order_signature(tasks_state)) {
			return
		}

		tasks_state = next
		await dash_reorder_client.post_task_reorder(page.url.pathname, next, dragged_id)
		await invalidateAll()
	}

	const display_tasks = $derived(
		dash_task_filters.filter_display_tasks(tasks_state, {
			search_query,
			selected_label_ids,
			filter_mode,
		}),
	)

	let search_input_element = $state<HTMLInputElement | undefined>()

	let completing_task_id = $state<string | undefined>()
	let deleting_task_id = $state<string | undefined>()
	let uncompleting_task_id = $state<string | undefined>()
	let editing_task_id = $state<string | undefined>()
	let inline_edit_focus_pulse = $state(0)
	let is_begin_add_at_top_running = $state(false)

	function start_task_edit(task_id: string): void {
		editing_task_id = task_id
	}

	function arrow_navigate_to_task(task_id: string): void {
		editing_task_id = task_id
		inline_edit_focus_pulse += 1
	}

	function cancel_task_edit(): void {
		editing_task_id = undefined
	}

	function is_open_task_row_empty(row: TaskItem): boolean {
		return !row.title.trim()
	}

	function read_first_open_empty_task_id(items: Array<TaskItem>): string | undefined {
		const row = items.find(
			(task_row) => task_row.completed_at === null && is_open_task_row_empty(task_row),
		)
		if (row === undefined) return undefined

		return row.id
	}

	async function fetch_create_task_at_top(): Promise<string | undefined> {
		const form_data = new FormData()

		form_data.set('title', '')
		form_data.set('insert_at_top', '1')

		const response = await dash_fetch.fetch_with_toast(
			`${page.url.pathname}?/create`,
			json_action_headers,
			form_data,
		)
		if (response === undefined) return undefined

		try {
			const action_result = deserialize(await response.text())

			return dash_action_result.read_task_id_from_action(action_result)
		} catch {
			return undefined
		}
	}

	async function resolve_add_at_top_target_id(): Promise<string | undefined> {
		const new_task_id = await fetch_create_task_at_top()

		await invalidateAll()
		await tick()

		if (new_task_id !== undefined) return new_task_id

		return read_first_open_empty_task_id(tasks_state)
	}

	async function resolve_add_top_target(
		editor_snapshot: string | undefined,
		items: Array<TaskItem>,
	): Promise<string | undefined> {
		const first_open_empty_id = read_first_open_empty_task_id(items)

		if (editor_snapshot !== undefined && editor_snapshot === first_open_empty_id) {
			inline_edit_focus_pulse += 1

			return undefined
		}

		return await resolve_add_at_top_target_id()
	}

	async function begin_add_at_top(): Promise<void> {
		if (is_begin_add_at_top_running) {
			inline_edit_focus_pulse += 1

			return
		}

		is_begin_add_at_top_running = true

		try {
			const target_id = await resolve_add_top_target(editing_task_id, tasks_state)
			if (target_id === undefined) return

			/* eslint-disable-next-line require-atomic-updates -- guarded by `is_begin_add_at_top_running` */
			editing_task_id = target_id
			inline_edit_focus_pulse += 1
		} finally {
			/* eslint-disable-next-line require-atomic-updates -- release lock after awaited work */
			is_begin_add_at_top_running = false
		}
	}

	function is_modifier_key_pressed(key_event: KeyboardEvent): boolean {
		return key_event.metaKey || key_event.ctrlKey
	}

	function handle_search_focus_shortcut(key_event: KeyboardEvent): boolean {
		if (!is_modifier_key_pressed(key_event) || key_event.shiftKey) return false
		if (key_event.key !== 'k') return false

		key_event.preventDefault()
		search_input_element?.focus()

		return true
	}

	function handle_add_task_shortcut(key_event: KeyboardEvent): void {
		if (!is_modifier_key_pressed(key_event) || !key_event.shiftKey) return
		if (key_event.key.toLowerCase() !== 'o') return

		key_event.preventDefault()
		void begin_add_at_top()
	}

	function handle_global_keydown(key_event: KeyboardEvent): void {
		if (key_event.isComposing) return
		if (handle_search_focus_shortcut(key_event)) return

		handle_add_task_shortcut(key_event)
	}

	async function handle_blur_commit_saved(saved_task_id: string): Promise<void> {
		await invalidateAll()
		await tick()

		if (editing_task_id !== saved_task_id) return

		const closed_id = saved_task_id

		queueMicrotask(() => {
			if (editing_task_id === closed_id) cancel_task_edit()
		})
	}

	async function handle_task_saved(current_id: string): Promise<void> {
		await invalidateAll()
		await tick()

		if (editing_task_id !== current_id) return

		inline_edit_focus_pulse += 1
	}

	async function create_task_after_row(after_task_id: string): Promise<string | undefined> {
		const form_data = new FormData()

		form_data.set('title', '')
		form_data.set('insert_after_task_id', after_task_id)

		const response = await dash_fetch.fetch_with_toast(
			`${page.url.pathname}?/create`,
			json_action_headers,
			form_data,
		)
		if (response === undefined) return undefined

		return dash_action_result.read_task_id_from_action(deserialize(await response.text()))
	}

	async function handle_title_enter_new_row(after_task_id: string): Promise<void> {
		const new_task_id = await create_task_after_row(after_task_id)

		await invalidateAll()
		await tick()

		if (new_task_id === undefined) {
			await handle_task_saved(after_task_id)

			return
		}

		editing_task_id = new_task_id
	}

	async function persist_cleared_inline_task(task_id: string): Promise<boolean> {
		const persist = new FormData()

		persist.set('task_id', task_id)
		persist.set('title', '')
		persist.set('detail', '')
		persist.set('due_date', '')
		persist.set('recurrence_rule', '')

		const update_response = await fetch(`${page.url.pathname}?/update_task`, {
			method: 'POST',
			headers: json_action_headers,
			body: persist,
		})

		return deserialize(await update_response.text()).type !== 'failure'
	}

	async function discard_empty_inline_task(task_id: string): Promise<void> {
		if (!(await persist_cleared_inline_task(task_id))) return

		const discard = new FormData()

		discard.set('task_id', task_id)
		await fetch(`${page.url.pathname}?/discard_empty_open_task`, {
			method: 'POST',
			headers: json_action_headers,
			body: discard,
		})

		await invalidateAll()
		// Only cancel the edit if this task is still the active editor — the user may have
		// already clicked another row, setting editing_task_id to a different task.
		if (editing_task_id === task_id) cancel_task_edit()
	}

	async function complete_task(task_id: string): Promise<void> {
		completing_task_id = task_id
		tasks_state = tasks_state.filter((row) => row.id !== task_id)

		const form_data = new FormData()

		form_data.set('task_id', task_id)
		await fetch(`${page.url.pathname}?/complete`, {
			method: 'POST',
			headers: json_action_headers,
			body: form_data,
		})
		completing_task_id = undefined
		void invalidateAll()
	}

	async function delete_completed_task(task_id: string): Promise<void> {
		deleting_task_id = task_id
		tasks_state = tasks_state.filter((row) => row.id !== task_id)

		const form_data = new FormData()

		form_data.set('task_id', task_id)
		await fetch(`${page.url.pathname}?/delete_completed`, {
			method: 'POST',
			headers: json_action_headers,
			body: form_data,
		})
		deleting_task_id = undefined
		void invalidateAll()
	}

	async function uncomplete_task(task_id: string): Promise<void> {
		uncompleting_task_id = task_id
		const form_data = new FormData()

		form_data.set('task_id', task_id)
		await fetch(`${page.url.pathname}?/uncomplete`, {
			method: 'POST',
			headers: json_action_headers,
			body: form_data,
		})
		uncompleting_task_id = undefined
		await invalidateAll()
	}
</script>

<svelte:window onkeydown={handle_global_keydown} />

<CenteredPageWithHeader
	title={m.dash_title()}
	page_title={m.dash_page_title()}
	description={m.dash_description()}
	content_vertical_align="start"
>
	<DashSearchBar
		{data}
		is_completed_view={data.is_completed_view}
		bind:search_query
		bind:selected_label_ids
		bind:filter_mode
		bind:search_input_element
		input_class={DASH_PAGE_UI.SEARCH_INPUT_CLASS}
	/>

	<DashTasksPanel
		{data}
		{form}
		input_class={DASH_PAGE_UI.INPUT_CLASS}
		has_create_row={!data.is_completed_view}
		on_quick_add_at_top={begin_add_at_top}
		{inline_edit_focus_pulse}
		{editing_task_id}
		on_start_task_edit={start_task_edit}
		on_arrow_navigate_to_task={arrow_navigate_to_task}
		on_cancel_task_edit={cancel_task_edit}
		on_task_saved={handle_task_saved}
		on_blur_commit_saved={handle_blur_commit_saved}
		on_title_enter_new_row={handle_title_enter_new_row}
		on_discard_empty_inline={discard_empty_inline_task}
		{display_tasks}
		{has_filter}
		{completing_task_id}
		{deleting_task_id}
		{uncompleting_task_id}
		on_complete={complete_task}
		on_delete_completed={delete_completed_task}
		on_uncomplete={uncomplete_task}
		is_reorder_enabled={!has_filter && !data.is_completed_view}
		on_reorder_commit={reorder_commit}
	/>
</CenteredPageWithHeader>
