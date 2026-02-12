<script lang="ts">
	import { resolve } from '$app/paths'
	import LocaleSwitcherAdaptive from '$lib/components/locale-switcher/LocaleSwitcherAdaptive.svelte'
	import LocaleSwitcherDropdown from '$lib/components/locale-switcher/LocaleSwitcherDropdown.svelte'
	import LocaleSwitcherIcon from '$lib/components/locale-switcher/LocaleSwitcherIcon.svelte'
	import LocaleSwitcherInline from '$lib/components/locale-switcher/LocaleSwitcherInline.svelte'
	import LocaleSwitcherOriginal from '$lib/components/locale-switcher/LocaleSwitcherOriginal.svelte'
	import LocaleSwitcherPopover from '$lib/components/locale-switcher/LocaleSwitcherPopover.svelte'

	const VARIANTS: Array<{
		id: string
		title: string
		description: string
		component: typeof LocaleSwitcherOriginal
	}> = [
		{
			id: 'original',
			title: '0. 現状（ボタン横並び）',
			description: 'すべての言語を横並びで表示。言語数が増えると占有が大きくなる。',
			component: LocaleSwitcherOriginal,
		},
		{
			id: 'dropdown',
			title: '1. ドロップダウン',
			description: '現在の言語のみ表示し、クリックで展開。常時コンパクト。',
			component: LocaleSwitcherDropdown,
		},
		{
			id: 'popover',
			title: '2. ポップオーバー',
			description: '地球アイコン＋クリックでメニュー表示。モダンなUI。',
			component: LocaleSwitcherPopover,
		},
		{
			id: 'adaptive',
			title: '3. 折りたたみ式（適応型）',
			description: '4言語以下はボタン表示、5言語以上でドロップダウンに切り替え。',
			component: LocaleSwitcherAdaptive,
		},
		{
			id: 'inline',
			title: '4. ヘッダー/設定用',
			description: 'コンパクトなインライン表示。ヘッダーや設定画面向け。',
			component: LocaleSwitcherInline,
		},
		{
			id: 'icon',
			title: '5. ツールチップ付きアイコン',
			description: '最小限のアイコン表示。ホバーでツールチップ、クリックで選択。',
			component: LocaleSwitcherIcon,
		},
	]
</script>

<svelte:head>
	<title>Locale Switcher 比較デモ</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 p-8">
	<div>
		<a
			href={resolve('/demo')}
			class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
		>
			← デモ一覧に戻る
		</a>
		<h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
			Locale Switcher バリアント比較
		</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">
			言語選択UIの5つのパターンと現状を比較できます。各カード内で実際に切り替えを試せます。
		</p>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		{#each VARIANTS as variant (variant.id)}
			<div
				class="relative min-h-[140px] rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<div class="mb-4">
					<h2 class="font-semibold text-gray-900 dark:text-white">{variant.title}</h2>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						{variant.description}
					</p>
				</div>
				<div class="absolute right-4 bottom-4">
					<svelte:component this={variant.component} />
				</div>
			</div>
		{/each}
	</div>
</div>
