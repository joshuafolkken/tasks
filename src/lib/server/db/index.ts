import { worker_environment } from '$lib/server/worker-environment'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export const db = drizzle(worker_environment.environment.DB, { schema })
