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
  BankTransferChargeRequest,
  EWalletChargeRequest,
  CStoreChargeRequest,
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
    const bankTransfer: BankTransferChargeRequest = { bank }
    if (vaNumber) {
      bankTransfer.va_number = vaNumber
    }
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'bank_transfer',
      bank_transfer: bankTransfer,
    }
  }

  createGoPayCharge(orderId: string, amount: number, callbackUrl?: string): ChargeRequest {
    const gopay: EWalletChargeRequest = { provider: 'gopay' }
    if (callbackUrl) {
      gopay.callback_url = callbackUrl
      gopay.enable_callback = true
    }
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'gopay',
      gopay,
    }
  }

  createShopeepayCharge(orderId: string, amount: number, callbackUrl?: string): ChargeRequest {
    const shopeepay: EWalletChargeRequest = { provider: 'shopeepay' }
    if (callbackUrl) {
      shopeepay.callback_url = callbackUrl
      shopeepay.enable_callback = true
    }
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'shopeepay',
      shopeepay,
    }
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
    const cstore: CStoreChargeRequest = { store }
    if (message) {
      cstore.message = message
    }
    return {
      transaction_details: { order_id: orderId, gross_amount: amount },
      payment_type: 'cstore',
      cstore,
    }
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
