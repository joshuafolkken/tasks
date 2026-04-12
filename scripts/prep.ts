#!/usr/bin/env tsx
/**
 * Pre-implementation preparation: switch to main, pull, update deps, verify overrides.
 *
 * Usage: tsx scripts/prep.ts
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { overrides_check, type OverridesDiff } from './overrides/overrides-logic'

const PACKAGE_JSON_PATH = 'package.json'

interface PackageJson {
	pnpm?: { overrides?: Record<string, string> }
}

function run(command: string): void {
	console.info(`\n▶ ${command}`)
	execSync(command, { stdio: 'inherit' }) // eslint-disable-line sonarjs/os-command
}

function read_overrides(): Record<string, string> {
	return overrides_check.read_overrides_from_package(readFileSync(PACKAGE_JSON_PATH, 'utf8'))
}

function save_snapshot(overrides: Record<string, string>): void {
	writeFileSync(overrides_check.SNAPSHOT_PATH, `${JSON.stringify(overrides, undefined, '\t')}\n`)
}

function restore_overrides(snapshot: Record<string, string>): void {
	const package_json = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as PackageJson

	package_json.pnpm ??= {}
	package_json.pnpm.overrides = snapshot
	writeFileSync(PACKAGE_JSON_PATH, `${JSON.stringify(package_json, undefined, '\t')}\n`)
}

function report_diff(diff: OverridesDiff): void {
	console.error('\n⚠ pnpm.overrides was modified by dependency update!')

	for (const entry of diff.removed) {
		console.error(`  - removed: ${entry.key} (was ${entry.value})`)
	}

	for (const entry of diff.modified) {
		console.error(`  ~ changed: ${entry.key}: ${entry.old_value} → ${entry.new_value}`)
	}

	for (const entry of diff.added) {
		console.error(`  + added:   ${entry.key} → ${entry.value}`)
	}
}

function handle_overrides_change(snapshot: Record<string, string>): void {
	restore_overrides(snapshot)
	run('pnpm install')
	console.info('\n✔ Overrides restored from snapshot. Please review before proceeding.')
}

// Step 1: switch to main and pull
run('git switch main')
run('git pull')

// Step 2: save overrides snapshot
const snapshot = read_overrides()

save_snapshot(snapshot)
console.info('\n✔ Overrides snapshot saved.')

// Step 3: run pnpm latest (corepack + update + audit)
run('pnpm latest')

// Step 4: compare overrides
const diff = overrides_check.compare(snapshot, read_overrides())

if (diff.is_changed) {
	report_diff(diff)
	handle_overrides_change(snapshot)
} else {
	console.info('\n✔ pnpm.overrides unchanged. Ready to implement.')
}
