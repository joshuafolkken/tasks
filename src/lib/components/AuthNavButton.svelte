<script lang="ts">
	import LoadingButton from '$lib/components/LoadingButton.svelte'
	import { i18n } from '$lib/locale/i18n'
	import { m } from '$lib/paraglide/messages'
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

	function handle_nav_click(): void {
		if (is_logged_in) {
			go_to(ROUTES.ACCOUNT)

			return
		}

		go_to(ROUTES.LOGIN)
	}
</script>

<div class="flex justify-center">
	<div class="min-w-48">
		<LoadingButton
			label={is_logged_in ? m.home_account() : m.home_sign_in()}
			loading_label={m.common_loading()}
			is_loading={is_navigating}
			variant="primary"
			on_click={handle_nav_click}
		/>
	</div>
</div>
