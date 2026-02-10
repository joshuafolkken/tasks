export const form_utilities = {
	get_string: (value: FormDataEntryValue | null): string => {
		return typeof value === 'string' ? value : ''
	},
}
