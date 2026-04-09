import { git_gh_command } from './git-gh-command'
import { git_notify, type GitNotifyConfig } from './git-notify'

// cspell:words coderabbit coderabbitai

const CHECK_STATUS_PASS = 'pass'
const CHECK_STATUS_PENDING = 'pending'
const CHECK_STATUS_FAIL = 'fail'
const REQUIRED_CHECKS = ['Workers Builds: tasks', 'CodeRabbit', 'SonarQube']
const CODERABBIT_AUTHOR = 'coderabbitai[bot]'
const CODERABBIT_FLAG = '_⚠️ Potential issue_'
const CODERABBIT_RESOLVED = '✅ Addressed in commit'
const CHECK_WAIT_INTERVAL_MS = 10_000
const CHECK_MAX_ATTEMPTS = 18

interface RollupCheck {
	name: string
	status: string
}

interface PullComment {
	body?: string
	html_url?: string
	user?: {
		login?: string
	}
}

const KEY_TYPE_NAME = '__typename'
const KEY_STATE = 'state'
const KEY_STATUS = 'status'
const KEY_CONCLUSION = 'conclusion'
const KEY_NAME = 'name'
const KEY_CONTEXT = 'context'
const KEY_STATUS_ROLLUP = 'statusCheckRollup'

interface FollowupInput {
	branch_name: string
	issue_number: string | undefined
	notify_config: GitNotifyConfig | undefined
	coderabbit_ignore_reason: string | undefined
	is_skip_watch: boolean
}

function read_string(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined
	const trimmed = value.trim()
	if (trimmed.length === 0) return undefined

	return trimmed
}

function parse_status_context(item: Record<string, unknown>): string {
	const state = read_string(item[KEY_STATE])?.toLowerCase()
	if (state === 'success') return CHECK_STATUS_PASS
	if (state === 'pending') return CHECK_STATUS_PENDING

	return CHECK_STATUS_FAIL
}

function parse_check_run(item: Record<string, unknown>): string {
	const status = read_string(item[KEY_STATUS])?.toLowerCase()
	if (status !== 'completed') return CHECK_STATUS_PENDING
	const conclusion = read_string(item[KEY_CONCLUSION])?.toLowerCase()

	return conclusion === 'success' ? CHECK_STATUS_PASS : CHECK_STATUS_FAIL
}

function parse_rollup_status(item: Record<string, unknown>): string {
	const type_name = read_string(item[KEY_TYPE_NAME])
	if (type_name === 'StatusContext') return parse_status_context(item)

	return parse_check_run(item)
}

function read_rollup_array(parsed: unknown): Array<Record<string, unknown>> {
	if (typeof parsed !== 'object' || parsed === null) return []
	const parsed_record = parsed as Record<string, unknown>
	const rollup = parsed_record[KEY_STATUS_ROLLUP]
	if (!Array.isArray(rollup)) return []

	return rollup.filter((item): item is Record<string, unknown> => {
		return typeof item === 'object' && item !== null
	})
}

function parse_json_safe(raw_json: string): unknown {
	try {
		return JSON.parse(raw_json) as unknown
	} catch {
		return undefined
	}
}

function parse_rollup_item(item: Record<string, unknown>): RollupCheck | undefined {
	const name = read_string(item[KEY_NAME]) ?? read_string(item[KEY_CONTEXT])
	if (name === undefined) return undefined

	return { name, status: parse_rollup_status(item) }
}

function parse_rollup_checks(raw_json: string): Array<RollupCheck> {
	const parsed = parse_json_safe(raw_json)
	const rollup = read_rollup_array(parsed)
	const checks: Array<RollupCheck> = []

	for (const item of rollup) {
		const parsed_item = parse_rollup_item(item)

		if (parsed_item !== undefined) {
			checks.push(parsed_item)
		}
	}

	return checks
}

async function sleep(ms: number): Promise<void> {
	await new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function has_pending_check(checks: ReadonlyArray<RollupCheck>): boolean {
	return checks.some((check) => check.status === CHECK_STATUS_PENDING)
}

async function wait_checks_completed(branch_name: string): Promise<Array<RollupCheck>> {
	for (let attempt = 0; attempt < CHECK_MAX_ATTEMPTS; attempt += 1) {
		const rollup_json = await git_gh_command.pr_get_status_rollup(branch_name)
		const checks = parse_rollup_checks(rollup_json)
		if (!has_pending_check(checks)) return checks

		await sleep(CHECK_WAIT_INTERVAL_MS)
	}

	throw new Error('Timed out while waiting for PR checks to complete.')
}

function assert_all_checks_passed(checks: ReadonlyArray<RollupCheck>): void {
	if (checks.length === 0) throw new Error('No checks found on PR.')
	const failed_checks = checks.filter((check) => check.status === CHECK_STATUS_FAIL)
	if (failed_checks.length === 0) return
	const summary = failed_checks.map((check) => `${check.name}:${check.status}`).join(', ')

	throw new Error(`Failed checks detected: ${summary}`)
}

function find_required_check(
	checks: ReadonlyArray<RollupCheck>,
	required_name: string,
): RollupCheck | undefined {
	return checks.find((check) => check.name === required_name)
}

function assert_required_check_status(input: {
	required_name: string
	matched: RollupCheck | undefined
}): void {
	if (input.matched === undefined) throw new Error(`Required check missing: ${input.required_name}`)
	if (input.matched.status === CHECK_STATUS_PASS) return

	throw new Error(`Required check not passed: ${input.required_name} (${input.matched.status})`)
}

function assert_required_checks_passed(checks: ReadonlyArray<RollupCheck>): void {
	for (const required_name of REQUIRED_CHECKS) {
		const matched = find_required_check(checks, required_name)

		assert_required_check_status({ required_name, matched })
	}
}

function parse_pull_comments(raw_json: string): Array<PullComment> {
	try {
		const parsed: unknown = JSON.parse(raw_json)
		if (!Array.isArray(parsed)) return []

		return parsed as Array<PullComment>
	} catch {
		return []
	}
}

function read_unresolved_cr_urls(comments: ReadonlyArray<PullComment>): Array<string> {
	return comments
		.filter((comment) => comment.user?.login === CODERABBIT_AUTHOR)
		.filter((comment) => (comment.body ?? '').includes(CODERABBIT_FLAG))
		.filter((comment) => !(comment.body ?? '').includes(CODERABBIT_RESOLVED))
		.map((comment) => comment.html_url ?? '')
		.filter((url) => url.length > 0)
}

function build_ignore_reason_comment(reason: string, urls: ReadonlyArray<string>): string {
	const lines = [
		'Some CodeRabbit findings were intentionally left unresolved.',
		`Reason: ${reason.trim()}`,
		'Affected comments:',
	]

	for (const url of urls) {
		lines.push(`- ${url}`)
	}

	return lines.join('\n')
}

function validate_ignore_reason(reason: string | undefined): string {
	if (reason === undefined || reason.trim().length === 0) {
		throw new Error('Fix findings or pass --coderabbit-ignore-reason.')
	}

	return reason
}

async function handle_coderabbit_findings(input: {
	branch_name: string
	ignore_reason: string | undefined
}): Promise<void> {
	const comments_json = await git_gh_command.pr_get_review_comments(input.branch_name)
	const unresolved_urls = read_unresolved_cr_urls(parse_pull_comments(comments_json))
	if (unresolved_urls.length === 0) return
	const ignore_reason = validate_ignore_reason(input.ignore_reason)
	const reason_comment = build_ignore_reason_comment(ignore_reason, unresolved_urls)

	await git_gh_command.pr_comment(input.branch_name, reason_comment)
}

function build_notify_body(input: {
	notify_config: GitNotifyConfig
	issue_number: string | undefined
	pr_url: string | undefined
}): string {
	return git_notify.build_completion_comment_body({
		message: input.notify_config.message,
		issue_number: input.issue_number,
		pr_url: input.pr_url,
		mentions: input.notify_config.mentions,
	})
}

async function post_notify_issue(input: {
	issue_number: string | undefined
	body: string
}): Promise<void> {
	if (input.issue_number === undefined) {
		throw new Error('Issue number is required for issue notification.')
	}

	await git_gh_command.issue_comment(input.issue_number, input.body)
}

function should_notify_pr(target: GitNotifyConfig['target']): boolean {
	return target === 'pr' || target === 'both'
}

function should_notify_issue(target: GitNotifyConfig['target']): boolean {
	return target === 'issue' || target === 'both'
}

async function post_completion_notification(input: {
	branch_name: string
	issue_number: string | undefined
	notify_config: GitNotifyConfig | undefined
}): Promise<void> {
	if (input.notify_config === undefined) return

	const pr_url = await git_gh_command.pr_get_url(input.branch_name)
	const body = build_notify_body({
		notify_config: input.notify_config,
		issue_number: input.issue_number,
		pr_url,
	})
	const { target } = input.notify_config

	if (should_notify_pr(target)) {
		await git_gh_command.pr_comment(input.branch_name, body)
	}

	if (should_notify_issue(target)) {
		await post_notify_issue({ issue_number: input.issue_number, body })
	}
}

async function run_checks(input: { branch_name: string; is_skip_watch: boolean }): Promise<void> {
	if (!input.is_skip_watch) {
		console.info('')
		console.info('📊 Watching PR checks...')
		await git_gh_command.pr_checks_watch(input.branch_name)
	}

	const checks = await wait_checks_completed(input.branch_name)

	assert_all_checks_passed(checks)
	assert_required_checks_passed(checks)
}

async function run(input: FollowupInput): Promise<void> {
	await run_checks({ branch_name: input.branch_name, is_skip_watch: input.is_skip_watch })
	await handle_coderabbit_findings({
		branch_name: input.branch_name,
		ignore_reason: input.coderabbit_ignore_reason,
	})
	await post_completion_notification({
		branch_name: input.branch_name,
		issue_number: input.issue_number,
		notify_config: input.notify_config,
	})
}

const git_pr_followup = {
	run,
}

export { git_pr_followup }
export type { FollowupInput }
