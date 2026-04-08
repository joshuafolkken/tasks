import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SAVED_AUTH_STORAGE = {
	FILE_PATH: path.join(fileURLToPath(new URL('.', import.meta.url)), '.auth', 'user.json'),
} as const
