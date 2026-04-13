import { json, type Handle } from '@sveltejs/kit'

const MAX_REQUESTS = 10
const WINDOW_MS = 60_000
const MS_PER_SECOND = 1000
const AUTH_PATH_PREFIX = '/api/auth/'
const RETRY_AFTER_HEADER = 'Retry-After'
const RATE_LIMITED_AUTH_PATHS = [
	'/api/auth/sign-in',
	'/api/auth/sign-up',
	'/api/auth/forget-password',
]

interface RateLimitEntry {
	timestamps: Array<number>
}

const rate_limit_store = new Map<string, RateLimitEntry>()

function get_client_ip(request: Request): string {
	const cf_ip = request.headers.get('cf-connecting-ip')
	if (cf_ip) return cf_ip

	const forwarded = request.headers.get('x-forwarded-for')
	if (forwarded) return forwarded.split(',').at(0)?.trim() ?? forwarded.trim()

	return '0.0.0.0'
}

function is_rate_limited_path(pathname: string): boolean {
	return RATE_LIMITED_AUTH_PATHS.some((path) => pathname.startsWith(path))
}

function clean_expired_timestamps(timestamps: Array<number>, now: number): Array<number> {
	const cutoff = now - WINDOW_MS

	return timestamps.filter((ts) => ts > cutoff)
}

function check_rate_limit(client_ip: string, now: number): boolean {
	const entry = rate_limit_store.get(client_ip)
	if (!entry) return false

	const valid_timestamps = clean_expired_timestamps(entry.timestamps, now)

	entry.timestamps = valid_timestamps

	return valid_timestamps.length >= MAX_REQUESTS
}

function record_request(client_ip: string, now: number): void {
	const entry = rate_limit_store.get(client_ip)

	if (entry) {
		entry.timestamps.push(now)
	} else {
		rate_limit_store.set(client_ip, { timestamps: [now] })
	}
}

function get_retry_after_seconds(client_ip: string, now: number): number {
	const entry = rate_limit_store.get(client_ip)
	if (!entry || entry.timestamps.length === 0) return 0

	const oldest = Math.min(...entry.timestamps)
	const retry_after_ms = oldest + WINDOW_MS - now

	return Math.max(1, Math.ceil(retry_after_ms / MS_PER_SECOND))
}

const handle_rate_limit: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url

	if (!is_rate_limited_path(pathname)) return await resolve(event)

	const client_ip = get_client_ip(event.request)
	const now = Date.now()

	if (check_rate_limit(client_ip, now)) {
		const retry_after = get_retry_after_seconds(client_ip, now)

		return json(
			{ error: 'Too many requests' },
			{
				status: 429,
				headers: { [RETRY_AFTER_HEADER]: String(retry_after) },
			},
		)
	}

	record_request(client_ip, now)

	return await resolve(event)
}

/** Clear all entries — exposed for testing only. */
function clear_store(): void {
	rate_limit_store.clear()
}

const rate_limiter = {
	handle_rate_limit,
	is_rate_limited_path,
	check_rate_limit,
	record_request,
	get_retry_after_seconds,
	get_client_ip,
	clear_store,
	MAX_REQUESTS,
	WINDOW_MS,
	MS_PER_SECOND,
	AUTH_PATH_PREFIX,
	RATE_LIMITED_AUTH_PATHS,
}

export { rate_limiter }
