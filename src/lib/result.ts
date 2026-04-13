/**
 * Re-export neverthrow primitives as the project-wide Result convention.
 *
 * Consumer code:
 *   import { ok, err, type Result } from '$lib/result'
 */
export { err, ok, type Result } from 'neverthrow'
