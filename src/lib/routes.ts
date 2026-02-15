export const ROUTES = {
	HOME: '/',
	ACCOUNT: '/account',
	AUTH_LOGIN: '/auth/login',
	AUTH_CALLBACK: '/auth/callback',
	AUTH_ERROR: '/auth/error',
} as const

export const DEMO_SUPABASE_ROUTES = {
	HOME: '/demo/supabase',
	ACCOUNT: '/demo/supabase/account',
	AUTH_CALLBACK: '/demo/supabase/auth/callback',
	AUTH_ERROR: '/demo/supabase/auth/error',
} as const
