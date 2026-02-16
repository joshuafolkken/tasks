import { common_app_title } from '$lib/paraglide/messages'

/**
 * ページの <title> 用。引数が common_app_title と同じ場合はそのまま返し、それ以外は「サブタイトル | アプリ名」形式で返す。
 */
function title(subtitle: string): string {
	const app_title = common_app_title()

	return subtitle === app_title ? subtitle : `${subtitle} | ${app_title}`
}

export const page_title = { title }
