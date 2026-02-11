import type { SupabaseClient } from '@supabase/supabase-js'

interface ProfileData {
	full_name: string
	username: string
	website: string
}

export const profile_service = {
	get_profile: async (supabase: SupabaseClient, user_id: string): Promise<ProfileData | null> => {
		const { data, error } = await supabase
			.from('profiles')
			.select('username, full_name, website')
			.eq('id', user_id)
			.single()

		if (error) {
			// eslint-disable-next-line unicorn/no-null
			return null
		}

		return {
			full_name: data.full_name as string,
			username: data.username as string,
			website: data.website as string,
		}
	},

	update_profile: async (
		supabase: SupabaseClient,
		user_id: string,
		profile: ProfileData,
	): Promise<{ error: Error | null }> => {
		const { error } = await supabase.from('profiles').upsert({
			id: user_id,
			...profile,
			updated_at: new Date(),
		})

		return { error }
	},
}
