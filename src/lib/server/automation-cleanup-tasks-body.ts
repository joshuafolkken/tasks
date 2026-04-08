const MAX_CLEANUP_TITLES = 50
const MAX_TITLE_CHARS = 500

type ParsedCleanupBody = { ok: true; titles: Array<string> } | { ok: false }

function is_plain_object(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object'
}

function is_valid_title_string(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0 && value.length <= MAX_TITLE_CHARS
}

function is_non_empty_string_array(value: Array<unknown>): value is Array<string> {
	return value.every(is_valid_title_string)
}

function validate_raw_array(raw: unknown): raw is Array<unknown> {
	return Array.isArray(raw) && raw.length > 0 && raw.length <= MAX_CLEANUP_TITLES
}

function has_titles_key(value: Record<string, unknown>): value is { titles: unknown } {
	return 'titles' in value
}

function extract_titles(body: unknown): ParsedCleanupBody {
	if (!is_plain_object(body)) return { ok: false }
	if (!has_titles_key(body)) return { ok: false }
	const { titles } = body
	if (!validate_raw_array(titles)) return { ok: false }
	if (!is_non_empty_string_array(titles)) return { ok: false }

	return { ok: true, titles }
}

export { extract_titles, MAX_CLEANUP_TITLES, MAX_TITLE_CHARS }
export type { ParsedCleanupBody }
