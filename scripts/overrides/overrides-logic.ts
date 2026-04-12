interface AddedEntry {
	key: string
	value: string
}

interface RemovedEntry {
	key: string
	value: string
}

interface ModifiedEntry {
	key: string
	old_value: string
	new_value: string
}

interface OverridesDiff {
	is_changed: boolean
	added: Array<AddedEntry>
	removed: Array<RemovedEntry>
	modified: Array<ModifiedEntry>
}

function find_added(
	snapshot_keys: Set<string>,
	current: Record<string, string>,
): Array<AddedEntry> {
	return Object.entries(current)
		.filter(([key]) => !snapshot_keys.has(key))
		.map(([key, value]) => ({ key, value }))
}

function find_removed(
	current_keys: Set<string>,
	snapshot: Record<string, string>,
): Array<RemovedEntry> {
	return Object.entries(snapshot)
		.filter(([key]) => !current_keys.has(key))
		.map(([key, value]) => ({ key, value }))
}

function find_modified(
	snapshot: Record<string, string>,
	current: Record<string, string>,
): Array<ModifiedEntry> {
	return Object.entries(snapshot)
		.filter(([key]) => key in current && snapshot[key] !== current[key])
		.map(([key, old_value]) => ({ key, old_value, new_value: current[key] ?? '' }))
}

function compare(snapshot: Record<string, string>, current: Record<string, string>): OverridesDiff {
	const snapshot_keys = new Set(Object.keys(snapshot))
	const current_keys = new Set(Object.keys(current))

	const added = find_added(snapshot_keys, current)
	const removed = find_removed(current_keys, snapshot)
	const modified = find_modified(snapshot, current)
	const is_changed = added.length > 0 || removed.length > 0 || modified.length > 0

	return { is_changed, added, removed, modified }
}

const SNAPSHOT_PATH = '.overrides-snapshot.json'

function read_overrides_from_package(package_json_content: string): Record<string, string> {
	const parsed = JSON.parse(package_json_content) as {
		pnpm?: { overrides?: Record<string, string> }
	}

	return parsed.pnpm?.overrides ?? {}
}

const overrides_check = { compare, read_overrides_from_package, SNAPSHOT_PATH }

export type { OverridesDiff, AddedEntry, RemovedEntry, ModifiedEntry }
export { overrides_check }
