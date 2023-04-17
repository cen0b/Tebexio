import Axios, { AxiosResponse, Method } from 'axios'
import { AbortController } from './AbortController'
import { Agent as HTTPSAgent } from 'https'
import { Agent as HTTPAgent } from 'http'
import type { RestClient } from './Client'
import type { RequestOptions } from '../types'
import { API, USER_AGENT } from './Constants'

const httpsAgent = new HTTPSAgent({ keepAlive: true })
const httpAgent = new HTTPAgent({ keepAlive: true })

export class Request {
  protected readonly client: RestClient
  protected readonly method: string
  protected readonly endpoint: string
  protected readonly options: RequestOptions
  public constructor(client: RestClient, method: string, endpoint: string, options: RequestOptions = {}) {
    this.client = client
    this.method = method
    this.endpoint = endpoint
    this.options = options
  }

  public async make<R extends Record<any, any>>(): Promise<AxiosResponse<R, any>> {
    const url = API + this.endpoint

    let headers = {
      ...this.options.headers,
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
    }

    const data = this.options.data ?? {}

    if (this.options.authenticated !== false) headers = Object.assign(headers, this.client.auth)

    const controller = new AbortController()
    const { signal } = controller
    const timeout = setTimeout(() => controller.abort(), this.options.timeout ?? 15_000)
    return Axios(url, {
      method: this.method as Method,
      headers,
      httpsAgent,
      httpAgent,
      data,
      signal
    }).finally(() => clearTimeout(timeout))
  }
}