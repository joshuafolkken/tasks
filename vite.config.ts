import { readFileSync } from 'node:fs'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { defineConfig } from 'vitest/config'

const package_json = JSON.parse(readFileSync('./package.json', 'utf-8'))
export default defineConfig({
	define: {
		'import.meta.env.APP_VERSION': JSON.stringify(package_json.version),
		'import.meta.env.E2E_CLEANUP_ENABLED': process.env['E2E_CLEANUP_ENABLED'] === '1',
	},
	server: {
		allowedHosts: ['.trycloudflare.com'],
	},
	// rrule は package の `main` が CJS のため、外部のままだと Node 上の SSR 解析で named import が壊れる。Worker バンドル（wrangler）とも整合させる。
	ssr: {
		noExternal: ['rrule'],
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale'],
			emitTsDeclarations: true,
		}),
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'scripts',
					environment: 'node',
					include: ['scripts/**/*.{test,spec}.{js,ts}'],
				},
			},
		],
	},
})
