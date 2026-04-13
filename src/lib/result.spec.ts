import { describe, expect, it } from 'vitest'
// eslint-disable-next-line unicorn/prevent-abbreviations -- `err` is the canonical neverthrow API name
import { err, ok } from './result'

const SAMPLE_ERROR_MESSAGE = 'something went wrong'
const MULTIPLIER = 2

describe('Result utility (neverthrow re-export)', () => {
	it('ok() creates a successful Result', () => {
		const result = ok(42)

		expect(result.isOk()).toBe(true)
		expect(result.isErr()).toBe(false)
		if (result.isErr()) return
		expect(result.value).toBe(42)
	})

	it('err() creates a failed Result', () => {
		const result = err(SAMPLE_ERROR_MESSAGE)

		expect(result.isErr()).toBe(true)
		expect(result.isOk()).toBe(false)
		if (result.isOk()) return
		expect(result.error).toBe(SAMPLE_ERROR_MESSAGE)
	})

	it('map() transforms the success value', () => {
		const result = ok(10).map((value) => value * MULTIPLIER)

		expect(result.isOk()).toBe(true)
		if (result.isErr()) return
		expect(result.value).toBe(20)
	})

	it('map() does not run on error Result', () => {
		const result = err('fail').map((value: number) => value * MULTIPLIER)

		expect(result.isErr()).toBe(true)
		if (result.isOk()) return
		expect(result.error).toBe('fail')
	})
})
