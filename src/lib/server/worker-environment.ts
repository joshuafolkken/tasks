/**
 * Node 上では `cloudflare:workers` を import できない（`ERR_UNSUPPORTED_ESM_URL_SCHEME`）。
 * - `pnpm dev`: Wrangler の platform proxy で bindings を得る。
 * デプロイ済み Worker 内だけ `cloudflare:workers` を動的 import する。
 *
 * `import.meta.env.DEV` を使う理由:
 * Vite がコンパイル時定数として置換するため、本番ビルド後に wrangler が
 * バンドルする際に `if (false)` ブランチ全体が dead code elimination で削除され、
 * `wrangler` / `miniflare` (~17 MiB) がバンドルに含まれなくなる。
 * `$app/environment` の `building` は wrangler の esbuild がコンパイル時定数として
 * 認識しないため、使用すると wrangler/miniflare がバンドルされて 3 MiB 制限を超える。
 * `vite build` でサーバーモジュールは実行されない（プリレンダリングなし）ため問題なし。
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
	if (import.meta.env.DEV) {
		return await load_bindings_wrangler_proxy()
	}

	const { env: worker_bindings } = await import(/* @vite-ignore */ 'cloudflare:workers')

	return worker_bindings as unknown as Env
}

const environment = await load_worker_environment()

export const worker_environment = { environment }
