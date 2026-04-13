/**
 * Node 上では `cloudflare:workers` を import できない（`ERR_UNSUPPORTED_ESM_URL_SCHEME`）。
 * - `pnpm dev`: Wrangler の platform proxy で bindings を得る。
 * デプロイ済み Worker 内だけ `cloudflare:workers` を動的 import する。
 *
 * `import.meta.env.DEV` を使う理由:
 * Vite がコンパイル時定数として置換するため、本番ビルド後に wrangler が
 * バンドルする際に `if (false)` ブランチ全体が dead code elimination で削除され、
 * `wrangler` / `miniflare` (~17 MiB) がバンドルに含まれなくなる。
 * `building` を `import.meta.env.DEV` の代わりに使うと wrangler の esbuild が
 * コンパイル時定数として認識せず wrangler/miniflare がバンドルされる。
 * そのため `building` は `cloudflare:workers` ガードにのみ使用し、
 * wrangler proxy ガードは引き続き `import.meta.env.DEV` を使う。
 *
 * Vite 8 では SSR ビルド中にサーバーモジュールが同期評価されるようになったため、
 * `building` で `cloudflare:workers` import を回避する必要がある。
 */
import { building } from '$app/environment'
import { environment_validation } from './environment-validation'

function is_vitest_run(): boolean {
	return Boolean(process.env['VITEST'])
}

async function load_bindings_wrangler_proxy(): Promise<Env> {
	const { getPlatformProxy: get_platform_proxy } = await import('wrangler')
	// Vitest parallel workers must not share one wrangler persist SQLite (SQLITE_BUSY).
	const { env: worker_bindings } = await get_platform_proxy({
		configPath: 'wrangler.jsonc',
		persist: !is_vitest_run(),
		remoteBindings: false,
	})

	return worker_bindings as unknown as Env
}

async function load_worker_environment(): Promise<Env> {
	if (building) return {} as unknown as Env
	if (import.meta.env.DEV) return await load_bindings_wrangler_proxy()

	const { env: worker_bindings } = await import(/* @vite-ignore */ 'cloudflare:workers')

	return worker_bindings as unknown as Env
}

const environment = await load_worker_environment()

if (!building && !is_vitest_run()) {
	environment_validation.validate_worker_environment(environment)
}

export const worker_environment = { environment }
