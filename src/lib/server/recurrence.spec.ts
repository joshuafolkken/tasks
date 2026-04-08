import { describe, expect, it } from 'vitest'
import { recurrence } from './recurrence'

describe('recurrence.next_due', () => {
	it('returns next ISO date after anchor for weekly rule', () => {
		const after = new Date(Date.UTC(2026, 0, 1, 12, 0, 0))
		const next_iso = recurrence.next_due('FREQ=WEEKLY;BYDAY=MO', after)

		expect(next_iso).toBeTruthy()
		if (next_iso) expect(next_iso.length).toBe(10)
	})

	it('returns undefined for invalid rule string', () => {
		expect(recurrence.next_due('not-a-valid-rrule', new Date())).toBeUndefined()
	})
})
