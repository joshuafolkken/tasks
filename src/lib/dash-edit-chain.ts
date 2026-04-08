/** After saving an inline task edit, choose the next editor target (Gmail-style chain). */
function next_focus_after_task_save(
	ordered_task_ids: Array<string>,
	current_id: string,
): { mode: 'next_task'; task_id: string } | { mode: 'create' } {
	const index = ordered_task_ids.indexOf(current_id)

	if (index !== -1 && index < ordered_task_ids.length - 1) {
		const task_id = ordered_task_ids[index + 1]

		if (task_id !== undefined) return { mode: 'next_task', task_id }
	}

	return { mode: 'create' }
}

const dash_edit_chain = {
	next_focus_after_task_save,
}

export { dash_edit_chain }
