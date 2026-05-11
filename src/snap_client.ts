import type { HttpClient } from './http_client.js'
import type { SnapTransactionRequest, SnapTransactionResponse } from './types.js'

export class SnapClient {
  constructor(private readonly httpClient: HttpClient) {}

  async createTransaction(params: SnapTransactionRequest): Promise<SnapTransactionResponse> {
    return this.httpClient.request<SnapTransactionResponse>('POST', '/transactions', 'snap', params)
  }
}
