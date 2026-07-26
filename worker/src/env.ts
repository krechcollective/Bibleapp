export interface Env {
  DB: D1Database
  PASSAGE_CACHE: KVNamespace
  ESV_API_KEY?: string
  BIBLE_API_KEY?: string
  ENVIRONMENT: string
}

// Single-user deployment for now; every row is scoped to this id.
export const DEFAULT_USER_ID = 'default'
