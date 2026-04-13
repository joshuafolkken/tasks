import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import { describe, expect, it } from 'vitest'
import { dash_form_schemas } from './dash-form-schemas'

describe('dash_form_schemas with sveltekit-superforms', () => {
	it('superValidate parses create_task_schema from FormData', async () => {
		const form_data = new FormData()

		form_data.set('title', '  Hello  ')
		form_data.set('detail', 'body')

		const form = await superValidate(form_data, zod4(dash_form_schemas.create_task_schema))

		expect(form.valid).toBe(true)
		expect(form.data.title).toBe('Hello')
		expect(form.data.detail).toBe('body')
	})

	it('superValidate rejects invalid update_task_schema', async () => {
		const form_data = new FormData()

		form_data.set('title', 'Hi')

		const form = await superValidate(form_data, zod4(dash_form_schemas.update_task_schema))

		expect(form.valid).toBe(false)
		expect(form.errors.task_id).toBeDefined()
	})

	it('superValidate parses complete_task_schema', async () => {
		const form_data = new FormData()

		form_data.set('task_id', 'abc-123')

		const form = await superValidate(form_data, zod4(dash_form_schemas.complete_task_schema))

		expect(form.valid).toBe(true)
		expect(form.data.task_id).toBe('abc-123')
	})
})
