function as_object_record(data: unknown): Record<string, unknown> | undefined {
	if (typeof data !== 'object' || data === null) {
		return undefined
	}

	return data as Record<string, unknown>
}

function read_success_data_record(result: unknown): Record<string, unknown> | undefined {
	if (result === null || typeof result !== 'object') {
		return undefined
	}

	const { type, data } = result as { type?: string; data?: unknown }

	if (type !== 'success') {
		return undefined
	}

	return as_object_record(data)
}

function read_non_empty_string_field(
	data: Record<string, unknown> | undefined,
	field: string,
): string | undefined {
	if (data === undefined) {
		return undefined
	}

	const value = data[field]

	if (typeof value !== 'string' || value.length === 0) {
		return undefined
	}

	return value
}

function read_focus_task_id_from_action(result: unknown): string | undefined {
	return read_non_empty_string_field(read_success_data_record(result), 'focus_task_id')
}

function read_task_id_from_action(result: unknown): string | undefined {
	return read_non_empty_string_field(read_success_data_record(result), 'task_id')
}

const dash_action_result = {
	read_focus_task_id_from_action,
	read_task_id_from_action,
}

export { dash_action_result }
