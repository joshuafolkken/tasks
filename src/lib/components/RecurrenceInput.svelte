<script lang="ts">
	import { m } from '$lib/paraglide/messages'
	import { task_rrule, type TaskRruleFreq, type TaskRruleState } from '$lib/task-rrule'

	interface Props {
		value?: string
	}

	let { value = $bindable('') }: Props = $props()

	function default_editor_state(): TaskRruleState {
		return {
			freq: 'none',
			interval: 1,
			days: [],
			month_day: 1,
			wp_pos: 1,
			wp_day: 'MO',
			year_month: 1,
			year_day: 1,
		}
	}

	function editor_state_for(rrule_string: string): TaskRruleState {
		const parsed = task_rrule.parse_to_state(rrule_string)

		if (parsed !== undefined) return parsed

		return default_editor_state()
	}

	const initial_rrule = editor_state_for(value)
	let freq = $state<TaskRruleFreq>(initial_rrule.freq)
	let interval = $state(initial_rrule.interval)
	let days = $state([...initial_rrule.days])
	let month_day = $state(initial_rrule.month_day)
	let wp_pos = $state(initial_rrule.wp_pos)
	let wp_day = $state(initial_rrule.wp_day)
	let year_month = $state(initial_rrule.year_month)
	let year_day = $state(initial_rrule.year_day)

	$effect.pre(() => {
		const next = editor_state_for(value)

		freq = next.freq
		interval = next.interval
		days = [...next.days]
		month_day = next.month_day
		wp_pos = next.wp_pos
		wp_day = next.wp_day
		year_month = next.year_month
		year_day = next.year_day
	})

	const WEEKDAYS = [
		{ value: 'MO', label: '月' },
		{ value: 'TU', label: '火' },
		{ value: 'WE', label: '水' },
		{ value: 'TH', label: '木' },
		{ value: 'FR', label: '金' },
		{ value: 'SA', label: '土' },
		{ value: 'SU', label: '日' },
	]

	const MONTHS = Array.from({ length: 12 }, (_, index) => {
		const month_number = index + 1

		return {
			value: month_number,
			label: `${String(month_number)}月`,
		}
	})

	const MONTHLY_WEEK_POSITIONS = [
		{ value: 1, label: m.dash_week_pos_1() },
		{ value: 2, label: m.dash_week_pos_2() },
		{ value: 3, label: m.dash_week_pos_3() },
		{ value: 4, label: m.dash_week_pos_4() },
	]

	const FREQ_UNIT_BY_FREQ: Partial<Record<TaskRruleFreq, string>> = {
		daily: m.dash_recurrence_unit_day(),
		weekly: m.dash_recurrence_unit_week(),
		monthly_date: m.dash_recurrence_unit_month(),
		monthly_weekday: m.dash_recurrence_unit_month(),
		yearly: m.dash_recurrence_unit_year(),
	}

	function freq_unit_for(current: TaskRruleFreq): string {
		return FREQ_UNIT_BY_FREQ[current] ?? ''
	}

	const freq_unit = $derived(freq_unit_for(freq))

	function toggle_day(day_code: string): void {
		days = days.includes(day_code) ? days.filter((day) => day !== day_code) : [...days, day_code]
	}

	$effect(() => {
		const built = task_rrule.build({
			freq,
			interval,
			days,
			month_day,
			wp_pos,
			wp_day,
			year_month,
			year_day,
		})

		if (built === value) return

		if (task_rrule.parse_to_state(value) === undefined && value.trim() !== '') return

		value = built
	})

	const input_base_class =
		'rounded-lg border border-gray-300 px-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white'
	const select_class = `${input_base_class} py-1.5`
	const number_class = `w-16 ${input_base_class} py-1`
</script>

<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-2">
	<label
		for="recurrence_freq"
		class="shrink-0 self-center text-sm font-medium text-gray-700 dark:text-gray-300"
	>
		{m.dash_recurrence_label()}
	</label>
	<select
		id="recurrence_freq"
		bind:value={freq}
		class="{select_class} w-full min-w-0 sm:w-auto"
		onkeydown={(key_event) => {
			if (key_event.key !== 'Enter' || key_event.isComposing) return
			key_event.preventDefault()
		}}
	>
		<option value="none">{m.dash_recurrence_none()}</option>
		<option value="daily">{m.dash_recurrence_daily()}</option>
		<option value="weekly">{m.dash_recurrence_weekly()}</option>
		<option value="monthly_date">{m.dash_recurrence_monthly_date()}</option>
		<option value="monthly_weekday">{m.dash_recurrence_monthly_weekday()}</option>
		<option value="yearly">{m.dash_recurrence_yearly()}</option>
	</select>

	{#if freq !== 'none'}
		<div class="col-start-2 flex min-w-0 flex-wrap items-center gap-2">
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>{m.dash_recurrence_every_prefix()}</span
			>
			<input type="number" bind:value={interval} min="1" max="99" class={number_class} />
			<span class="text-sm text-gray-500 dark:text-gray-400"
				>{freq_unit}{m.dash_recurrence_every_suffix()}</span
			>
		</div>
	{/if}

	{#if freq === 'weekly'}
		<div class="col-start-2 flex min-w-0 flex-wrap gap-1">
			{#each WEEKDAYS as { value: day_value, label: day_label } (day_value)}
				<button
					type="button"
					onclick={() => {
						toggle_day(day_value)
					}}
					class="h-8 w-8 rounded-full text-xs font-medium transition-colors {days.includes(
						day_value,
					)
						? 'bg-blue-600 text-white'
						: 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
				>
					{day_label}
				</button>
			{/each}
		</div>
	{/if}

	{#if freq === 'monthly_date'}
		<div class="col-start-2 flex min-w-0 flex-wrap items-center gap-2">
			<input type="number" bind:value={month_day} min="1" max="31" class={number_class} />
			<span class="text-sm text-gray-500 dark:text-gray-400">{m.dash_recurrence_day_suffix()}</span>
		</div>
	{/if}

	{#if freq === 'monthly_weekday'}
		<div class="col-start-2 flex min-w-0 flex-wrap items-center gap-2">
			<select bind:value={wp_pos} class={select_class}>
				{#each MONTHLY_WEEK_POSITIONS as position_row (position_row.value)}
					<option value={position_row.value}>{position_row.label}</option>
				{/each}
			</select>
			<select bind:value={wp_day} class={select_class}>
				{#each WEEKDAYS as { value: day_value, label: day_label } (day_value)}
					<option value={day_value}>{day_label}曜日</option>
				{/each}
			</select>
		</div>
	{/if}

	{#if freq === 'yearly'}
		<div class="col-start-2 flex min-w-0 flex-wrap items-center gap-2">
			<select bind:value={year_month} class={select_class}>
				{#each MONTHS as { value: month_value, label: month_label } (month_value)}
					<option value={month_value}>{month_label}</option>
				{/each}
			</select>
			<input type="number" bind:value={year_day} min="1" max="31" class={number_class} />
			<span class="text-sm text-gray-500 dark:text-gray-400">{m.dash_recurrence_day_suffix()}</span>
		</div>
	{/if}
</div>
