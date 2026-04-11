<script lang="ts">
	/* eslint-disable prefer-const -- $bindable() props must use let in a single $props() destructuring */
	import { dash_display } from '$lib/dash-display'
	import { m } from '$lib/paraglide/messages'
	import {
		dash_task_form_shared,
		LABEL_BLUR_DELAY_MS,
		type LabelItem,
	} from './dash-task-form-shared'

	interface Props {
		all_labels: ReadonlyArray<LabelItem>
		selected_labels: ReadonlyArray<string>
		label_input?: string
		input_class: string
		on_toggle: (name: string) => void
		on_add: (name: string) => void
		on_remove_pending: (name: string) => void
		on_keydown?: (event: KeyboardEvent) => void
		input_testid?: string
	}

	let {
		all_labels,
		selected_labels,
		label_input = $bindable(''),
		input_class,
		on_toggle,
		on_add,
		on_remove_pending,
		on_keydown,
		input_testid,
	}: Props = $props()

	const pending_new_label_names = $derived(
		dash_task_form_shared.compute_pending_new_labels(selected_labels, all_labels),
	)
	const label_suggestions = $derived(
		dash_task_form_shared.compute_label_suggestions(label_input, all_labels, selected_labels),
	)

	let is_label_focused = $state(false)
</script>

{#each selected_labels as hidden_label (hidden_label)}
	<input type="hidden" name="labels" value={hidden_label} />
{/each}
{#if all_labels.length > 0 || pending_new_label_names.length > 0}
	<div class="flex flex-wrap gap-1.5">
		{#each all_labels as label_row (label_row.id)}
			<button
				type="button"
				onclick={() => {
					on_toggle(label_row.name)
				}}
				class={dash_display.label_chip_filter_class(
					label_row.name,
					selected_labels.includes(label_row.name),
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
					aria-label={m.dash_label_remove_aria()}
					onclick={() => {
						on_remove_pending(new_label)
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
		data-testid={input_testid}
		bind:value={label_input}
		onkeydown={on_keydown}
		onfocus={() => {
			is_label_focused = true
		}}
		onblur={() => {
			setTimeout(() => {
				is_label_focused = false
			}, LABEL_BLUR_DELAY_MS)
		}}
		placeholder={m.dash_create_label_placeholder()}
		class={input_class}
	/>
	{#if is_label_focused && label_suggestions.length > 0}
		<div
			class="absolute top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
		>
			{#each label_suggestions as suggestion (suggestion.id)}
				<button
					type="button"
					class="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
					onclick={() => {
						on_add(suggestion.name)
					}}
				>
					{suggestion.name}
				</button>
			{/each}
		</div>
	{/if}
</div>
