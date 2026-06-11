import { MidtransError, MidtransAPIError, MidtransHTTPError } from './midtrans_error.js'
import type { MidtransConfig } from './types.js'

export class HttpClient {
  private readonly serverKey: string
  private readonly irisKey?: string
  private readonly sandbox: boolean
  private readonly timeout: number
  private readonly debug: boolean

  constructor(config: MidtransConfig) {
    this.serverKey = config.serverKey
    this.irisKey = config.irisKey
    this.sandbox = config.sandbox
    this.timeout = config.timeout
    this.debug = config.debug
  }

  buildUrl(api: 'snap' | 'core' | 'iris', path: string): string {
    const host = this.sandbox
      ? api === 'core'
        ? 'api.sandbox.midtrans.com'
        : 'app.sandbox.midtrans.com'
      : api === 'core'
        ? 'api.midtrans.com'
        : 'app.midtrans.com'

    const basePath = api === 'snap' ? '/snap/v1' : api === 'iris' ? '/iris/v1' : ''

    return `https://${host}${basePath}${path}`
  }

  async request<T>(
    method: string,
    path: string,
    api: 'snap' | 'core' | 'iris',
    body?: unknown
  ): Promise<T> {
    const url = this.buildUrl(api, path)
    const key = api === 'iris' ? (this.irisKey ?? this.serverKey) : this.serverKey
    const auth = Buffer.from(`${key}:`).toString('base64')

    const headers: Record<string, string> = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    if (this.debug) {
      const redactedBody = body ? JSON.stringify(body).replaceAll(key, '***REDACTED***') : undefined
      console.log(`[Midtrans HTTP] ${method} ${url}${redactedBody ? ` body=${redactedBody}` : ''}`)
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        const responseBody = await response.text()

        if (response.status >= 400 && response.status < 500) {
          let errorMessages: string[] = []
          let statusMessage = response.statusText

          try {
            const parsed = JSON.parse(responseBody)
            statusMessage = parsed.status_message || response.statusText
            errorMessages = parsed.validation_messages || [
              parsed.status_message || response.statusText,
            ]
          } catch {
            errorMessages = [responseBody || response.statusText]
          }

          throw new MidtransAPIError(response.status, statusMessage, errorMessages)
        }

        throw new MidtransHTTPError(
          response.status,
          url,
          method,
          responseBody || response.statusText
        )
      }

      return (await response.json()) as T
    } catch (error) {
      if (error instanceof MidtransError) {
        throw error
      }

      throw new MidtransHTTPError(
        0,
        url,
        method,
        `Midtrans request failed: ${(error as Error).message}`
      )
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
