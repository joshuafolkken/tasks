#!/usr/bin/env node
import { parseArgs } from 'node:util'
import { telegram_notify } from './git/telegram-notify'

const DEFAULT_TEST_MESSAGE = 'Test notification from tasks project.'

/* eslint-disable @typescript-eslint/naming-convention */
interface CliArguments {
	values: {
		message?: string
		'issue-number'?: string
		'pr-url'?: string
	}
}
/* eslint-enable @typescript-eslint/naming-convention */

function parse_cli_arguments(): CliArguments {
	return parseArgs({
		options: {
			message: { type: 'string' },
			'issue-number': { type: 'string' },
			'pr-url': { type: 'string' },
		},
	})
}

async function main(): Promise<void> {
	const { values } = parse_cli_arguments()

	await telegram_notify.send({
		message: values.message ?? DEFAULT_TEST_MESSAGE,
		issue_number: values['issue-number'],
		pr_url: values['pr-url'],
	})
}

await main()
