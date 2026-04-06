import { building, dev } from '$app/environment'

/**
 * Node 上では `cloudflare:workers` を import できない（`ERR_UNSUPPORTED_ESM_URL_SCHEME`）。
 * - `pnpm dev`: Wrangler の platform proxy で bindings を得る。
 * - `vite build` / prerender: `building === true` の間も同様（本番 Worker 以外では cloudflare: を読まない）。
 * デプロイ済み Worker 内だけ `cloudflare:workers` を動的 import する。
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
	if (dev || building) {
		return await load_bindings_wrangler_proxy()
	}

	const { env: worker_bindings } = await import(/* @vite-ignore */ 'cloudflare:workers')

	return worker_bindings as unknown as Env
}

const environment = await load_worker_environment()

export const worker_environment = { environment }
