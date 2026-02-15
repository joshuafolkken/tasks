<script lang="ts">
	import { resolve } from '$app/paths'
</script>

<ul class="space-y-2">
	<li>
		<a href={resolve('/demo/supabase')} class="text-blue-600 hover:underline dark:text-blue-400">
			supabase（SNS認証デモ）
		</a>
	</li>
	<li>
		<a href={resolve('/demo/paraglide')} class="text-blue-600 hover:underline dark:text-blue-400"
			>paraglide</a
		>
	</li>
	<li>
		<a
			href={resolve('/demo/locale-switcher')}
			class="text-blue-600 hover:underline dark:text-blue-400"
		>
			locale-switcher（バリアント比較）
		</a>
	</li>
</ul>
