<script lang="ts">
	import Card from '$lib/components/Card.svelte'
	import PlusIcon from '$lib/components/icons/PlusIcon.svelte'
	import type { ActionData, PageData } from '$lib/dash-page-types'
	import { m } from '$lib/paraglide/messages'
	import DashCreateTaskForm from './DashCreateTaskForm.svelte'

	interface Props {
		data: PageData
		form: ActionData
		input_class: string
		variant?: 'card' | 'list_row'
		/** Increment to open the card form and focus the title (e.g. external “add again”). */
		create_ui_pulse?: number
		/** List row: create an empty task at the top and focus its title (no inline create form). */
		on_quick_add_at_top?: () => Promise<void>
	}

	const {
		data,
		form,
		input_class,
		variant = 'card',
		create_ui_pulse = 0,
		on_quick_add_at_top,
	}: Props = $props()

	let is_form_open = $state(false)
	let last_seen_pulse = $state(0)

	const shell_class =
		'rounded-xl bg-white px-2 py-1.5 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50'

	const lead_col = 'flex h-9 w-9 shrink-0 items-center justify-center'

	$effect(() => {
		if (variant !== 'card') return

		if (create_ui_pulse > last_seen_pulse) {
			last_seen_pulse = create_ui_pulse
			is_form_open = true
		}
	})
</script>

{#if variant === 'list_row'}
	<div class="flex flex-col gap-y-[5px]">
		<div class="flex items-center gap-2 {shell_class}" data-dash-add-task-region>
			<button
				type="button"
				onclick={() => {
					void on_quick_add_at_top?.()
				}}
				class="{lead_col} text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
				aria-label={m.dash_list_add_task()}
			>
				<PlusIcon class="h-5 w-5" />
			</button>
			<button
				type="button"
				data-testid="dash-add-task-label"
				onclick={() => {
					void on_quick_add_at_top?.()
				}}
				class="min-w-0 flex-1 py-0 text-left text-sm text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
			>
				{m.dash_list_add_task()}
			</button>
		</div>
	</div>
{:else}
	<Card class="mb-4">
		<div class="flex flex-col gap-2">
			<button
				type="button"
				onclick={() => (is_form_open = true)}
				class="flex w-full items-center gap-2 text-gray-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
			>
				<PlusIcon class="h-5 w-5" />
				<span class="text-sm">{m.dash_create_add_placeholder()}</span>
			</button>
			{#if is_form_open}
				<div class="border-t border-gray-100 pt-2 dark:border-gray-700/80">
					<DashCreateTaskForm
						{data}
						{form}
						{input_class}
						{create_ui_pulse}
						on_dismiss={() => {
							is_form_open = false
						}}
					/>
				</div>
			{/if}
		</div>
	</Card>
{/if}
