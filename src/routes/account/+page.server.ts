import type { Session } from '@supabase/supabase-js'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { HTTP_STATUS } from '$lib/http'
import { i18n } from '$lib/i18n'
import type { PageServerLoad } from './$types'

function string_field(value: FormDataEntryValue | null): string {
	return typeof value === 'string' ? value : ''
}

async function get_profile_form_data(
	request: Request,
): Promise<{ full_name: string; username: string; website: string; avatar_url: string }> {
	const form_data = await request.formData()
	return {
		full_name: string_field(form_data.get('full_name')),
		username: string_field(form_data.get('username')),
		website: string_field(form_data.get('website')),
		avatar_url: string_field(form_data.get('avatar_url')),
	}
}

async function require_session(
	url: URL,
	safe_get_session: () => Promise<{ session: Session | null }>,
): Promise<Session> {
	const { session } = await safe_get_session()

	if (!session) {
		redirect(HTTP_STATUS.SEE_OTHER, i18n.home_path(url))
	}

	return session
}

const load: PageServerLoad = async ({ url, locals: { supabase, safe_get_session } }) => {
	const session = await require_session(url, safe_get_session)

	const { data: profile } = await supabase
		.from('profiles')
		.select('username, full_name, website, avatar_url')
		.eq('id', session.user.id)
		.single()

	return { session, profile }
}

const actions: Actions = {
	update: async ({ request, url, locals: { supabase, safe_get_session } }) => {
		const { full_name, username, website, avatar_url } = await get_profile_form_data(request)
		const session = await require_session(url, safe_get_session)

		const { error } = await supabase.from('profiles').upsert({
			id: session.user.id,
			full_name,
			username,
			website,
			avatar_url,
			updated_at: new Date(),
		})

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR, { full_name, username, website, avatar_url })
		}

		return { full_name, username, website, avatar_url }
	},
	signout: async ({ url, locals: { supabase, safe_get_session } }) => {
		await require_session(url, safe_get_session)

		const { error } = await supabase.auth.signOut()

		if (error) {
			return fail(HTTP_STATUS.INTERNAL_SERVER_ERROR)
		}

		return redirect(HTTP_STATUS.SEE_OTHER, i18n.home_path(url))
	},
}

export { load, actions }
