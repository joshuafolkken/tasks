import { dev } from '$app/environment'

/**
 * `pnpm dev`（Node / Vite）では `cloudflare:workers` が解決できない。
 * Wrangler の platform proxy でローカルと同じ bindings を得る。
 * 本番 Worker では動的 import で `cloudflare:workers` の env を使う。
 */
async function load_worker_environment(): Promise<Env> {
	if (dev) {
		const { getPlatformProxy: get_platform_proxy } = await import('wrangler')
		const { env: worker_bindings } = await get_platform_proxy({
			configPath: 'wrangler.jsonc',
			persist: true,
			remoteBindings: false,
		})

		return worker_bindings as unknown as Env
	}

	const { env: worker_bindings } = await import(/* @vite-ignore */ 'cloudflare:workers')

	return worker_bindings as unknown as Env
}

const environment = await load_worker_environment()

export const worker_environment = { environment }
