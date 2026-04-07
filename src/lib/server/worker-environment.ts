import { building } from '$app/environment'

/**
 * Node 上では `cloudflare:workers` を import できない（`ERR_UNSUPPORTED_ESM_URL_SCHEME`）。
 * - `pnpm dev`: Wrangler の platform proxy で bindings を得る。
 * - `vite build`: Node.js 上で実行されるため wrangler proxy を使う（building = true）。
 * デプロイ済み Worker 内だけ `cloudflare:workers` を動的 import する。
 *
 * `import.meta.env.DEV` を使う理由:
 * esbuild がコンパイル時定数として認識する。デプロイ済み Worker では Vite が
 * `__SVELTEKIT_BUILDING__` を `false` に置換するため、両方が false となり
 * `import('wrangler')` を含むブランチ全体が dead code elimination で削除される。
 * `$app/environment` の `dev` は esbuild がコンパイル時定数と認識しないケースがある。
 */
async function load_bindings_wrangler_proxy(): Promise<Env> {
	const { getPlatformProxy: get_platform_proxy } = await import('wrangler')
	const { env: worker_bindings } = await get_platform_proxy({
		configPath: 'wrangler.jsonc',
		persist: true,
		remoteBindings: false,
	})

	return worker_bindings as unknown as Env
}

async function load_worker_environment(): Promise<Env> {
	if (import.meta.env.DEV || building) {
		return await load_bindings_wrangler_proxy()
	}

	const { env: worker_bindings } = await import(/* @vite-ignore */ 'cloudflare:workers')

	return worker_bindings as unknown as Env
}

const environment = await load_worker_environment()

export const worker_environment = { environment }
