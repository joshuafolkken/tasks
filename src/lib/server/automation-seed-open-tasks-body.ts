import { z } from 'zod'

const MAX_SEED_TITLES = 20
const MAX_TITLE_CHARS = 500
const ERROR_INVALID = 'invalid body'
const ERROR_EMPTY_TITLE = 'empty title'
const ERROR_TOO_MANY = 'too many titles'
const ERROR_TOO_LONG = 'title too long'

type ParsedSeedBody = { ok: true; titles: Array<string> } | { ok: false; error: string }

const title_schema = z
	.string({ error: ERROR_INVALID })
	.transform((value) => value.trim())
	.check(
		z.refine((value) => value.length > 0, { error: ERROR_EMPTY_TITLE }),
		z.refine((value) => value.length <= MAX_TITLE_CHARS, { error: ERROR_TOO_LONG }),
	)

const titles_schema = z
	.array(title_schema, { error: ERROR_INVALID })
	.min(1, ERROR_EMPTY_TITLE)
	.max(MAX_SEED_TITLES, ERROR_TOO_MANY)

const seed_body_schema = z.object({ titles: titles_schema }, { error: ERROR_INVALID })

function parse_seed_open_tasks_json(body: unknown): ParsedSeedBody {
	const result = seed_body_schema.safeParse(body)

	if (!result.success) {
		const [first_issue] = result.error.issues

		return { ok: false, error: first_issue?.message ?? ERROR_INVALID }
	}

	return { ok: true, titles: result.data.titles }
}

export {
	parse_seed_open_tasks_json,
	MAX_SEED_TITLES,
	MAX_TITLE_CHARS,
	ERROR_INVALID,
	ERROR_EMPTY_TITLE,
	ERROR_TOO_MANY,
	ERROR_TOO_LONG,
}
export type { ParsedSeedBody }
