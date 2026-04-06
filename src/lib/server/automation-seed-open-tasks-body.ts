const MAX_SEED_TITLES = 20
const MAX_TITLE_CHARS = 500
const ERROR_INVALID = 'invalid body'
const ERROR_EMPTY_TITLE = 'empty title'
const ERROR_TOO_MANY = 'too many titles'
const ERROR_TOO_LONG = 'title too long'

type ParsedSeedBody = { ok: true; titles: Array<string> } | { ok: false; error: string }

function is_plain_record(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object'
}

function normalize_title_candidate(
	item: unknown,
): { ok: true; title: string } | { ok: false; error: string } {
	if (typeof item !== 'string') return { ok: false, error: ERROR_INVALID }

	const trimmed = item.trim()
	if (trimmed === '') return { ok: false, error: ERROR_EMPTY_TITLE }
	if (trimmed.length > MAX_TITLE_CHARS) return { ok: false, error: ERROR_TOO_LONG }

	return { ok: true, title: trimmed }
}

type TitlePushResult = { kind: 'continue' } | { kind: 'stop'; body: ParsedSeedBody }

function try_push_normalized_title(titles: Array<string>, item: unknown): TitlePushResult {
	const normalized = normalize_title_candidate(item)
	if (!normalized.ok) return { kind: 'stop', body: { ok: false, error: normalized.error } }

	titles.push(normalized.title)

	if (titles.length > MAX_SEED_TITLES) {
		return { kind: 'stop', body: { ok: false, error: ERROR_TOO_MANY } }
	}

	return { kind: 'continue' }
}

/* eslint-disable-next-line sonarjs/cognitive-complexity -- linear validation over a short list */
function collect_titles_from_array(raw_titles: unknown): ParsedSeedBody {
	if (!Array.isArray(raw_titles)) return { ok: false, error: ERROR_INVALID }

	const titles: Array<string> = []

	for (const item of raw_titles) {
		const step = try_push_normalized_title(titles, item)
		if (step.kind === 'stop') return step.body
	}

	if (titles.length === 0) return { ok: false, error: ERROR_EMPTY_TITLE }

	return { ok: true, titles }
}

function parse_seed_open_tasks_json(body: unknown): ParsedSeedBody {
	if (!is_plain_record(body)) return { ok: false, error: ERROR_INVALID }

	return collect_titles_from_array(body.titles)
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
