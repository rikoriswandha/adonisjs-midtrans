import type { HttpClient } from './http_client.js'
import type {
  DisbursementRequest,
  DisbursementResponse,
  DisbursementStatusResponse,
  DisbursementApprovalRequest,
} from './types.js'

export class IrisClient {
  constructor(private readonly httpClient: HttpClient) {}

  async createDisbursement(params: DisbursementRequest): Promise<DisbursementResponse> {
    return this.httpClient.request<DisbursementResponse>(
      'POST',
      '/api/v1/disbursements',
      'iris',
      params
    )
  }

  async getDisbursementStatus(disbursementId: string): Promise<DisbursementStatusResponse> {
    return this.httpClient.request<DisbursementStatusResponse>(
      'GET',
      `/api/v1/disbursements/${disbursementId}`,
      'iris'
    )
  }

  async approveDisbursement(params: DisbursementApprovalRequest): Promise<DisbursementResponse> {
    return this.httpClient.request<DisbursementResponse>(
      'POST',
      '/api/v1/disbursements/approve',
      'iris',
      params
    )
  }
}
