// AbortController polyfill using EventEmitter for NodeJS < v16
import { EventEmitter } from 'events'

// Known Signal Events
export interface SignalEvents {
  readonly onabort: string
}
// Signal Event Object
export interface SignalEvent {
  type: string
  target: AbortSignal
}

export class AbortSignal {
  public emitter = new EventEmitter()
  public onabort = (event: SignalEvent) => event
  public aborted = false
  // Override toString methods
  public get [Symbol.toStringTag]() {
    return 'AbortSignal'
  }

  public static get [Symbol.toStringTag]() {
    return 'AbortSignal'
  }

  // Override toString methods
  public toString(): string {
    return '[object AbortSignal]'
  }

  public static toString(): string {
    return '[object AbortSignal]'
  }

  // Remove Event Listener (Polyfill)
  public removeEventListener(name: string, handler: (...args: unknown[]) => void) {
    this.emitter.removeListener(name, handler)
  }

  // Add Event Listener (Polyfill)
  public addEventListener(name: string, handler: (...args: unknown[]) => void) {
    this.emitter.addListener(name, handler)
  }

  // Dispatch Event (Polyfill)
  public dispatchEvent(type: string): boolean {
    const event = { type, target: this }
    const handlerName = `on${type}` as keyof SignalEvents

    if (typeof this[handlerName] === 'function') this[handlerName](event)

    this.emitter.emit(type, event)

    return true
  }
}

export class AbortController {
  public signal = new AbortSignal()
  // Override toString methods
  public get [Symbol.toStringTag]() {
    return 'AbortController'
  }

  public static get [Symbol.toStringTag]() {
    return 'AbortController'
  }

  // Override toString methods
  public toString(): string {
    return '[object AbortController]'
  }

  public static toString(): string {
    return '[object AbortController]'
  }

  /**
   * Abort http(s) request
   */
  public abort(): void {
    if (this.signal.aborted) return

    this.signal.aborted = true
    this.signal.dispatchEvent('abort')
  }
}
