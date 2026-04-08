export const ROUTES = {
	HOME: '/',
	ACCOUNT: '/account',
	DASH: '/dash',
	LOGIN: '/login',
} as const satisfies Record<string, `/${string}`>

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/** ログイン・サインアウト後のリダイレクト先（現状はホーム） */
export const POST_AUTH_REDIRECT: AppRoutePath = ROUTES.HOME
