export interface NoopQueue {
  promise: Promise<void>
  resolve: () => void
  reject: () => void
}
