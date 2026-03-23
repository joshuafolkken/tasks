function is_fully_authenticated(locals: App.Locals): boolean {
	return Boolean(locals.session && locals.user)
}

const auth_locals = {
	is_fully_authenticated,
}

export { auth_locals }
