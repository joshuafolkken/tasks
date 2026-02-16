export const ROUTES = {
	HOME: '/',
	ACCOUNT: '/account',
	LOGIN: '/login',
} as const

/** ログイン・サインアウト後のリダイレクト先（現状はホーム） */
export const POST_AUTH_REDIRECT = ROUTES.HOME
