import { SUPABASE_AUTH_DEPENDENCY } from '$lib/config/constants'
import { supabase_client } from '$lib/supabase-client'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
	depends(SUPABASE_AUTH_DEPENDENCY)

	const supabase = supabase_client.create(fetch, data.cookies)

	const {
		data: { session },
	} = await supabase.auth.getSession()

	return { supabase, session }
}
