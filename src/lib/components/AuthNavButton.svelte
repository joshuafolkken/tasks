<script lang="ts">
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import { i18n } from '$lib/i18n'
	import { common_loading, home_account, home_sign_in } from '$lib/paraglide/messages'
	import { ROUTES } from '$lib/routes'

	interface Props {
		is_logged_in: boolean
	}
	const { is_logged_in }: Props = $props()

	let is_navigating = $state(false)

	function go_to(route: string): void {
		is_navigating = true
		i18n.goto(route)
	}
</script>

<div class="flex justify-center">
	<div class="min-w-48">
		<LoadingButton
			label={is_logged_in ? home_account() : home_sign_in()}
			loading_label={common_loading()}
			is_loading={is_navigating}
			variant="primary"
			on_click={is_logged_in
				? () => {
						go_to(ROUTES.ACCOUNT)
					}
				: () => {
						go_to(ROUTES.LOGIN)
					}}
		/>
	</div>
</div>
