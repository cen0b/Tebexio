export interface RequestOptions {
  authenticated?: boolean
  timeout?: number
  headers?: Record<string, unknown>
  data?: Record<string, unknown>
}