/** Shape every paginated list endpoint returns. `page` is 1-based. */
export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Result of an action applied to many items at once. */
export interface BulkResult {
  succeeded: number
  failed: { id?: string; label: string; error: string }[]
}
