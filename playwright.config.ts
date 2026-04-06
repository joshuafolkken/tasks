import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
import { SAVED_AUTH_STORAGE } from './e2e/saved-auth-storage-path'

// 環境判定と設定値の定数化
const isCI = Boolean(process.env['CI'])
// const isStaging = Boolean(process.env['STAGING']) // 将来の拡張用

const DEV_PORT = 5173
const PREVIEW_PORT = 4173
const APP_PORT = isCI ? PREVIEW_PORT : DEV_PORT
// `pnpm dev` の既定と揃える（127.0.0.1 だと環境によっては接続/待機がずれる）
const BASE_URL = `http://localhost:${String(APP_PORT)}`
const CI_TIMEOUT = 15_000
const LOCAL_TIMEOUT = 25_000
const TEST_TIMEOUT = 10_000
const EXPECT_TIMEOUT = 5_000
const ACTION_TIMEOUT = 5_000
const NAVIGATION_TIMEOUT = 10_000

const authed_storage_state = existsSync(SAVED_AUTH_STORAGE.FILE_PATH)
	? SAVED_AUTH_STORAGE.FILE_PATH
	: undefined

const chrome_desktop_use = {
	...devices['Desktop Chrome'],
	viewport: { width: 1280, height: 720 },
	launchOptions: {
		args: ['--disable-dev-shm-usage', '--disable-gpu', ...(isCI ? ['--no-sandbox'] : [])],
	},
}

// 環境に応じた設定を関数化
const getWebServerConfig = () => {
	if (isCI) {
		return {
			command: 'pnpm run preview:ci',
			url: BASE_URL,
			timeout: CI_TIMEOUT,
			reuseExistingServer: false,
		}
	}
	// 将来的に staging 環境を追加する場合
	// if (isStaging) { ... }
	return {
		command: 'pnpm run dev',
		url: BASE_URL,
		timeout: LOCAL_TIMEOUT,
		reuseExistingServer: true,
	}
}

export default defineConfig({
	webServer: getWebServerConfig(),
	testDir: 'e2e',
	fullyParallel: true,
	// Shared `e2e/.auth/user.json`: parallel workers mutate the same account and flake (dash races).
	workers: 1,
	// リトライ設定（CI でのみ有効、ローカルでは即座に失敗を確認）
	retries: isCI ? 2 : 0,
	// タイムアウト設定を最適化
	timeout: TEST_TIMEOUT,
	expect: {
		timeout: EXPECT_TIMEOUT,
	},
	// `e2e-guest`: 未認証のまま `page` を使うテスト（`storageState` なし）
	// `e2e-main` / `e2e-leak-check`: 保存済み `e2e/.auth/user.json` を `storageState` で注入（UI ログインはしない）
	projects: [
		{
			name: 'e2e-guest',
			testMatch: /\/(dash-guest|demo)\.test\.ts$/u,
			timeout: 45_000,
			use: chrome_desktop_use,
		},
		{
			name: 'e2e-main',
			timeout: 120_000,
			dependencies: ['e2e-guest'],
			testIgnore: /dash-leak-check\.test\.ts|dash-guest\.test\.ts|demo\.test\.ts/u,
			use: {
				...chrome_desktop_use,
				...(authed_storage_state ? { storageState: authed_storage_state } : {}),
			},
		},
		{
			name: 'e2e-leak-check',
			testMatch: /dash-leak-check\.test\.ts/u,
			timeout: 180_000,
			dependencies: ['e2e-main'],
			use: {
				...chrome_desktop_use,
				...(authed_storage_state ? { storageState: authed_storage_state } : {}),
			},
		},
	],
	// レポート設定
	reporter: isCI ? [['html'], ['github']] : [['html'], ['list']],
	// グローバル設定
	use: {
		baseURL: BASE_URL,
		// アクションのタイムアウト
		actionTimeout: ACTION_TIMEOUT,
		// ナビゲーションのタイムアウト
		navigationTimeout: NAVIGATION_TIMEOUT,
		// スクリーンショットは失敗時のみ（CI でのみ）
		screenshot: isCI ? 'only-on-failure' : 'off',
		// ビデオは失敗時のみ（CI でのみ）
		video: isCI ? 'retain-on-failure' : 'off',
		// トレースは失敗時のみ（CI でのみ）
		trace: isCI ? 'retain-on-failure' : 'off',
	},
})
