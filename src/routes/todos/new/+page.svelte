<script lang="ts">
	import Card from '$lib/components/Card.svelte'
	import CenteredPageLayout from '$lib/components/CenteredPageLayout.svelte'
	import PageHeader from '$lib/components/PageHeader.svelte'
	import SubmitButton from '$lib/components/SubmitButton.svelte'

	let title = $state('')
	let description = $state('')

	function handle_submit(event: SubmitEvent): void {
		event.preventDefault()
		// UI only - バックエンド連携は未実装
	}
</script>

<svelte:head>
	<title>TODOを登録 | Task Manager</title>
</svelte:head>

<CenteredPageLayout>
	<PageHeader title="TODOを登録" description="新しいタスクを追加しましょう" />

	<Card class="space-y-6">
		<form class="space-y-4" onsubmit={handle_submit}>
			<div>
				<label for="title" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					タイトル
				</label>
				<input
					id="title"
					name="title"
					type="text"
					bind:value={title}
					placeholder="やることを入力"
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
				/>
			</div>

			<div>
				<label
					for="description"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					説明（任意）
				</label>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="3"
					placeholder="詳細があれば入力"
					class="w-full rounded-lg border border-gray-300 px-4 py-2 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
				></textarea>
			</div>

			<div class="pt-2">
				<SubmitButton
					label="登録する"
					loading_label="登録中..."
					is_loading={false}
					variant="primary"
				/>
			</div>
		</form>
	</Card>
</CenteredPageLayout>
