// This is where typings for the builder should be
// after maintaining this for a while I realized how much
// I hate how discord has their endpoints set up
// and gave up on typing it
import { AxiosResponse } from 'axios';
import type { RequestOptions } from '.'

export interface Reflectors {
  /**
   * Get endpoint as string
   */
  toString(): string
  /**
   * Get endpoint as string
   */
  stringify(): string
  /**
   * Make a PUT request to endpoint
   */
  put<T extends Record<any, any>>(options?: RequestOptions): Promise<AxiosResponse<T, any>>
  /**
   * Make a POST request to endpoint
   */
  post<T extends Record<any, any>>(options?: RequestOptions): Promise<AxiosResponse<T, any>>
  /**
   * Make a DELETE request to endpoint
   */
  delete<T extends Record<any, any>>(options?: RequestOptions): Promise<AxiosResponse<T, any>>
  /**
   * Make a PATCH request to endpoint
   */
  patch<T extends Record<any, any>>(options?: RequestOptions): Promise<AxiosResponse<T, any>>
  /**
   * Make a GET request to endpoint
   */
  get<T extends Record<any, any>>(options?: RequestOptions): Promise<AxiosResponse<T, any>>
}

export interface EndpointTree extends Reflectors {
  // Gets pissed because Reflectors are functions not strings

  // @ts-expect-error We only need this for ide purposes, does not matter otherwise "ts(2411)"
  [key: string]: EndpointTree
}
