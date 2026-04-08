<script lang="ts">
	/* eslint-disable prefer-const -- $bindable() props must use let in a single $props() destructuring */
	import { dash_display } from '$lib/dash-display'
	import type { PageData } from '$lib/dash-page-types'
	import { i18n } from '$lib/locale/i18n'
	import { m } from '$lib/paraglide/messages'

	interface Props {
		data: PageData
		is_completed_view: boolean
		search_query?: string
		selected_label_ids?: Array<string>
		filter_mode?: 'one' | 'and' | 'or'
		input_class: string
		search_input_element?: HTMLInputElement | undefined
	}

	let {
		data,
		is_completed_view,
		search_query = $bindable(''),
		selected_label_ids = $bindable([]),
		filter_mode = $bindable('one'),
		input_class,
		search_input_element = $bindable(),
	}: Props = $props()

	function toggle_label_filter(label_id: string): void {
		if (filter_mode === 'one') {
			selected_label_ids = selected_label_ids.includes(label_id) ? [] : [label_id]

			return
		}

		selected_label_ids = selected_label_ids.includes(label_id)
			? selected_label_ids.filter((id) => id !== label_id)
			: [...selected_label_ids, label_id]
	}

	function cycle_filter_mode(): void {
		if (filter_mode === 'one') {
			filter_mode = 'and'

			return
		}

		if (filter_mode === 'and') {
			filter_mode = 'or'

			return
		}

		filter_mode = 'one'
		const [first] = selected_label_ids

		if (selected_label_ids.length > 1 && first !== undefined) {
			selected_label_ids = [first]
		}
	}

	function filter_mode_label(): string {
		if (filter_mode === 'one') return m.dash_filter_mode_one()

		if (filter_mode === 'and') return m.dash_filter_mode_and()

		return m.dash_filter_mode_or()
	}

	const view_wrap = 'inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800'
	const view_link_base =
		'flex h-9 w-9 items-center justify-center rounded-md text-gray-500 transition-colors hover:text-gray-800 sm:h-10 sm:w-10 dark:text-gray-400 dark:hover:text-gray-100'
	const view_link_active = 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
</script>

<div
	class="mb-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-800 dark:ring-gray-700/50"
>
	<div class="space-y-2">
		<div class="flex min-w-0 items-center gap-2">
			<input
				type="search"
				data-testid="dash-search-input"
				bind:this={search_input_element}
				bind:value={search_query}
				placeholder={m.dash_search_placeholder()}
				class="{input_class} min-w-0 flex-1"
			/>
			<div class="shrink-0 {view_wrap}">
				<a
					href={i18n.path('/dash')}
					class="{view_link_base} {is_completed_view ? '' : view_link_active}"
					aria-current={is_completed_view ? undefined : 'page'}
					aria-label={m.dash_tab_active()}
				>
					<svg
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="none"
						stroke="currentColor"
						aria-hidden="true"
					>
						<circle cx="10" cy="10" r="6.5" stroke-width="1.5"></circle>
						<circle cx="10" cy="10" r="2.25" fill="currentColor" stroke="none"></circle>
					</svg>
				</a>
				<a
					href={i18n.path('/dash?done=1')}
					class="{view_link_base} {is_completed_view ? view_link_active : ''}"
					aria-current={is_completed_view ? 'page' : undefined}
					aria-label={m.dash_tab_completed()}
				>
					<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
				</a>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-1.5">
			<button
				type="button"
				data-testid="dash-filter-mode-toggle"
				onclick={cycle_filter_mode}
				class="rounded-md border border-gray-300 px-2 py-0.5 font-mono text-xs font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-gray-600 dark:text-gray-400"
			>
				{filter_mode_label()}
			</button>
			{#each data.labels as label_row (label_row.id)}
				<button
					type="button"
					onclick={() => {
						toggle_label_filter(label_row.id)
					}}
					class={dash_display.label_chip_filter_class(
						label_row.name,
						selected_label_ids.includes(label_row.id),
					)}
				>
					{label_row.name}
				</button>
			{/each}
			{#if selected_label_ids.length > 0}
				<button
					type="button"
					data-testid="dash-filter-clear-labels"
					onclick={() => (selected_label_ids = [])}
					class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				>
					{m.dash_filter_clear()}
				</button>
			{/if}
		</div>
	</div>
</div>
