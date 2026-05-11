import type { HttpClient } from './http_client.js'
import type {
  TransactionStatusResponse,
  CancelResponse,
  RefundResponse,
  ExpireResponse,
  ApproveResponse,
  ChargeRequest,
  ChargeResponse,
  CreditCardChargeRequest,
} from './types.js'

export class CoreClient {
  constructor(private httpClient: HttpClient) {}

  async charge(params: ChargeRequest): Promise<ChargeResponse> {
    return this.httpClient.request('POST', '/v2/charge', 'core', params)
  }

  createCreditCardCharge(
    orderId: string,
    amount: number,
    cardDetails: CreditCardChargeRequest
  ): ChargeRequest {
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'credit_card',
      credit_card: cardDetails,
    }
  }

  createBankTransferCharge(
    orderId: string,
    amount: number,
    bank: 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata' | 'cimb',
    vaNumber?: string
  ): ChargeRequest {
    const request: ChargeRequest = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'bank_transfer',
      bank_transfer: { bank },
    }
    if (vaNumber) {
      request.bank_transfer.va_number = vaNumber
    }
    return request
  }

  createGoPayCharge(orderId: string, amount: number, callbackUrl?: string): ChargeRequest {
    const request: ChargeRequest = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'gopay',
      gopay: { provider: 'gopay' },
    }
    if (callbackUrl) {
      request.gopay.callback_url = callbackUrl
      request.gopay.enable_callback = true
    }
    return request
  }

  createShopeepayCharge(orderId: string, amount: number, callbackUrl?: string): ChargeRequest {
    const request: ChargeRequest = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'shopeepay',
      shopeepay: { provider: 'shopeepay' },
    }
    if (callbackUrl) {
      request.shopeepay.callback_url = callbackUrl
      request.shopeepay.enable_callback = true
    }
    return request
  }

  createQrisCharge(orderId: string, amount: number): ChargeRequest {
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'qris',
      qris: { provider: 'qris' },
    }
  }

  createCStoreCharge(
    orderId: string,
    amount: number,
    store: 'indomaret' | 'alfamart',
    message?: string
  ): ChargeRequest {
    const request: ChargeRequest = {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'cstore',
      cstore: { store },
    }
    if (message) {
      request.cstore.message = message
    }
    return request
  }

  createAkulakuCharge(orderId: string, amount: number): ChargeRequest {
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'akulaku',
      akulaku: { provider: 'akulaku' },
    }
  }

  createKredivoCharge(orderId: string, amount: number): ChargeRequest {
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'kredivo',
      kredivo: { provider: 'kredivo' },
    }
  }

  async status(orderId: string): Promise<TransactionStatusResponse> {
    return this.httpClient.request('GET', `/v2/${orderId}/status`, 'core')
  }

  async cancel(orderId: string): Promise<CancelResponse> {
    return this.httpClient.request('POST', `/v2/${orderId}/cancel`, 'core')
  }

  async refund(
    orderId: string,
    params?: { amount?: number; reason?: string }
  ): Promise<RefundResponse> {
    return this.httpClient.request('POST', `/v2/${orderId}/refund`, 'core', params)
  }

  async expire(orderId: string): Promise<ExpireResponse> {
    return this.httpClient.request('POST', `/v2/${orderId}/expire`, 'core')
  }

  async approve(orderId: string): Promise<ApproveResponse> {
    return this.httpClient.request('POST', `/v2/${orderId}/approve`, 'core')
  }
}
