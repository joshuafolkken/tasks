import { z } from 'zod'

const MAX_CLEANUP_TITLES = 50
const MAX_TITLE_CHARS = 500

type ParsedCleanupBody = { ok: true; titles: Array<string> } | { ok: false }

const cleanup_body_schema = z.object({
	titles: z.array(z.string().min(1).max(MAX_TITLE_CHARS)).min(1).max(MAX_CLEANUP_TITLES),
})

function extract_titles(body: unknown): ParsedCleanupBody {
	const result = cleanup_body_schema.safeParse(body)
	if (!result.success) return { ok: false }

	return { ok: true, titles: result.data.titles }
}

export { extract_titles, MAX_CLEANUP_TITLES, MAX_TITLE_CHARS }
export type { ParsedCleanupBody }
