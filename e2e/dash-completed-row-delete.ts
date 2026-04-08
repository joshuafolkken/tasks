import type { Locator } from '@playwright/test'
import { testid } from './dash-ux-navigation'

/* cspell:disable -- copied verbatim from Paraglide `messages` (km, uz) */
const COMPLETED_DELETE_ARIA_LABELS = [
	'Delete this completed task permanently',
	'完了済みタスクを完全に削除',
	'លុបកិច្ចការដែលបានបញ្ចប់ជាអចិន្ត្រៃយ៍',
	"Ushbu bajarilgan vazifani butunlay o'chirish",
] as const
/* cspell:enable */

const REGEXP_META_CHARS = /[$()*+.?[\\\]^{|}]/gu

function escape_regexp(text: string): string {
	return text.replaceAll(REGEXP_META_CHARS, (ch) => `\\${ch}`)
}

function delete_button_in_completed_row(completed_row: Locator): Locator {
	const by_testid = completed_row.getByTestId(testid.delete_completed)
	const pattern = new RegExp(
		COMPLETED_DELETE_ARIA_LABELS.map((label) => escape_regexp(label)).join('|'),
		'u',
	)
	const by_aria = completed_row.getByRole('button', { name: pattern })

	return by_testid.or(by_aria)
}

export { delete_button_in_completed_row }
