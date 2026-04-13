import { err, ok, type Result } from '$lib/result'
import { z } from 'zod'

const MAX_CLEANUP_TITLES = 50
const MAX_TITLE_CHARS = 500

const cleanup_body_schema = z.object({
	titles: z.array(z.string().min(1).max(MAX_TITLE_CHARS)).min(1).max(MAX_CLEANUP_TITLES),
})

function extract_titles(body: unknown): Result<Array<string>, string> {
	const result = cleanup_body_schema.safeParse(body)
	if (!result.success) return err('invalid body')

	return ok(result.data.titles)
}

export { extract_titles, MAX_CLEANUP_TITLES, MAX_TITLE_CHARS }
