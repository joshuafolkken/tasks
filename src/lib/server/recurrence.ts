import { RRule } from 'rrule'

/**
 * RRULE文字列から、指定日以降の次回日付を計算する。
 * @param rule_string RRULE文字列 (例: "FREQ=WEEKLY;BYDAY=MO,WE")
 * @param after この日付より後の次回日付を返す
 * @returns ISO日付文字列 "YYYY-MM-DD"、次回がなければ undefined
 */
function next_due(rule_string: string, after: Date): string | undefined {
	try {
		const rule = RRule.fromString(rule_string)
		const next = rule.after(after, false)
		if (!next) return undefined
		const [iso_date] = next.toISOString().split('T')

		return iso_date ?? undefined
	} catch {
		return undefined
	}
}

const recurrence = {
	next_due,
}

export { recurrence }
