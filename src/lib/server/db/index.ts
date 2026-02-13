import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

// event.platform?.env から D1 を取得
export function get_db(d1: D1Database) {
	return drizzle(d1, { schema })
}
