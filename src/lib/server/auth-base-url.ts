/**
 * Better Auth の SvelteKit 統合は `baseURL` の origin とリクエスト origin が一致しないと
 * `/api/auth/*` をハンドラに渡さず 404 になる。本番 URL が wrangler に固定されている
 * ローカル／CI プレビューでは動的 base URL で localhost を許可する。
 */
const AUTH_LOCAL_HOST_GLOBS = ['localhost*', '127.0.0.1*'] as const

interface ResolveAuthBaseUrlParameters {
	better_auth_url: string
	is_vite_dev: boolean
	is_e2e_cleanup: boolean
}

/* Better Auth `DynamicBaseURLConfig` のキーは upstream に合わせる */
/* eslint-disable @typescript-eslint/naming-convention */
interface AuthDynamicBaseUrl {
	allowedHosts: Array<string>
	fallback: string
	protocol: 'auto'
}
/* eslint-enable @typescript-eslint/naming-convention */

/* eslint-disable-next-line sonarjs/function-return-type -- Better Auth accepts `baseURL` as static string or dynamic config */
function resolve_auth_base_url(
	parameters: ResolveAuthBaseUrlParameters,
): string | AuthDynamicBaseUrl {
	if (!parameters.is_vite_dev && !parameters.is_e2e_cleanup) return parameters.better_auth_url

	return {
		allowedHosts: [...AUTH_LOCAL_HOST_GLOBS],
		fallback: parameters.better_auth_url,
		protocol: 'auto',
	}
}

const auth_base_url_module = { resolve_auth_base_url }

export { auth_base_url_module }
