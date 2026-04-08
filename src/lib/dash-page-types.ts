// Re-export SvelteKit route types for $lib (eslint: avoid `../` parent imports from components)
// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- intentional bridge from routes to $lib
export type { ActionData, PageData, TaskItem } from '../routes/dash/dash-page-types'
