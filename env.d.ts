/**
 * wrangler secret で管理されるプロパティの型定義。
 * wrangler.jsonc の vars には含めず、CI で wrangler types が生成する型に不足する分を補う。
 * 値は含まないため、リポジトリにコミットしても安全。
 */
declare namespace Cloudflare {
	interface Env {
		BETTER_AUTH_SECRET: string
		GOOGLE_CLIENT_SECRET: string
		AUTH_GITHUB_CLIENT_SECRET: string
	}
}
