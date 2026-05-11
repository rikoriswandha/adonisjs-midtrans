export interface MidtransConfig {
  serverKey: string
  clientKey?: string
  irisKey?: string
  sandbox: boolean
  timeout: number
  debug: boolean
}

export interface Address {
  first_name?: string
  last_name?: string
  address?: string
  city?: string
  postal_code?: string
  phone?: string
  country_code?: string
}

export interface ItemDetail {
  id: string
  price: number
  quantity: number
  name: string
  brand?: string
  category?: string
  merchant_name?: string
}

export interface CustomerDetail {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  billing_address?: Address
  shipping_address?: Address
}

export interface TransactionDetail {
  order_id: string
  gross_amount: number
}

export interface CreditCardOption {
  secure?: boolean
  bank?: string
  installment?: {
    term: number
  }
  channel?: string
}

export interface SnapTransactionRequest {
  transaction_details: TransactionDetail
  item_details?: ItemDetail[]
  customer_details?: CustomerDetail
  enabled_payments?: string[]
  credit_card?: CreditCardOption
  expiry?: {
    start_time?: string
    unit: 'day' | 'hour' | 'minute'
    duration: number
  }
  custom_field1?: string
  custom_field2?: string
  custom_field3?: string
  callbacks?: {
    finish?: string
    error?: string
    pending?: string
  }
}

export interface SnapTransactionResponse {
  token: string
  redirect_url: string
}

export interface CreditCardChargeRequest {
  card_number: string
  exp_month: string
  exp_year: string
  cvv: string
  bank?: string
  installment?: {
    term: number
  }
  token_id?: string
  secure?: boolean
}

export interface BankTransferChargeRequest {
  bank: 'bca' | 'bni' | 'bri' | 'mandiri' | 'permata' | 'cimb'
  va_number?: string
}

export interface EWalletChargeRequest {
  provider: 'gopay' | 'shopeepay' | 'qris'
  callback_url?: string
  enable_callback?: boolean
}

export interface CStoreChargeRequest {
  store: 'indomaret' | 'alfamart'
  message?: string
  alfamart_free_text_1?: string
  alfamart_free_text_2?: string
  alfamart_free_text_3?: string
}

export interface BNPLChargeRequest {
  provider: 'akulaku' | 'kredivo'
}

export interface ChargeBaseRequest {
  transaction_details: TransactionDetail
  item_details?: ItemDetail[]
  customer_details?: CustomerDetail
  custom_field1?: string
  custom_field2?: string
  custom_field3?: string
}

export interface CreditCardCharge extends ChargeBaseRequest {
  payment_type: 'credit_card'
  credit_card: CreditCardChargeRequest
}

export interface BankTransferCharge extends ChargeBaseRequest {
  payment_type: 'bank_transfer'
  bank_transfer: BankTransferChargeRequest
}

export interface GopayCharge extends ChargeBaseRequest {
  payment_type: 'gopay'
  gopay: EWalletChargeRequest
}

export interface ShopeepayCharge extends ChargeBaseRequest {
  payment_type: 'shopeepay'
  shopeepay: EWalletChargeRequest
}

export interface QrisCharge extends ChargeBaseRequest {
  payment_type: 'qris'
  qris: EWalletChargeRequest
}

export interface CstoreCharge extends ChargeBaseRequest {
  payment_type: 'cstore'
  cstore: CStoreChargeRequest
}

export interface AkulakuCharge extends ChargeBaseRequest {
  payment_type: 'akulaku'
  akulaku: BNPLChargeRequest
}

export interface KredivoCharge extends ChargeBaseRequest {
  payment_type: 'kredivo'
  kredivo: BNPLChargeRequest
}

export type ChargeRequest =
  | CreditCardCharge
  | BankTransferCharge
  | GopayCharge
  | ShopeepayCharge
  | QrisCharge
  | CstoreCharge
  | AkulakuCharge
  | KredivoCharge

export interface BaseMidtransResponse {
  status_code: string
  status_message: string
  transaction_id?: string
  order_id: string
  gross_amount: string
  payment_type: string
  transaction_time: string
  transaction_status: string
  fraud_status: string
  currency?: string
  signature_key?: string
}

export interface ChargeResponse extends BaseMidtransResponse {
  redirect_url?: string
  permata_va_number?: string
  va_numbers?: Array<{
    bank: string
    va_number: string
  }>
  bill_key?: string
  biller_code?: string
  actions?: Array<{
    name: string
    method: string
    url: string
  }>
  pdf_url?: string
  qr_code?: string
  deeplink_url?: string
}

export type TransactionStatusResponse = ChargeResponse & {
  settlement_time?: string
  expiry_time?: string
  merchant_id?: string
  acquirer?: string
  masked_card?: string
  bank?: string
  channel_response_code?: string
  channel_response_message?: string
  refund_amount?: string
  refunds?: Array<{
    refund_amount: string
    refund_reason: string
    refund_key: string
  }>
}

export interface CancelResponse extends BaseMidtransResponse {}

export interface RefundResponse extends BaseMidtransResponse {
  refund_amount?: string
  refund_key?: string
}

export interface ExpireResponse extends BaseMidtransResponse {}

export interface ApproveResponse extends BaseMidtransResponse {}

export interface IrisBankAccount {
  bank: string
  account: string
  name: string
}

export interface DisbursementRequest {
  bank_account: IrisBankAccount
  amount: number
  notes?: string
  reference_no?: string
}

export interface DisbursementResponse {
  disbursement_id: string
  reference_no: string
  status: string
  amount: string
  beneficiary_name: string
  beneficiary_account: string
  beneficiary_bank: string
  notes?: string
  created_at: string
}

export interface DisbursementStatusResponse {
  status: string
  amount: string
  bank_account: IrisBankAccount
  reference_no: string
  disbursement_id: string
  disbursement_type: string
  notes?: string
  failure_reason?: string
  created_at: string
}

export interface DisbursementApprovalRequest {
  disbursement_id: string
  otp?: string
}

export interface MidtransNotification {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
  transaction_status: string
  fraud_status: string
  payment_type: string
  transaction_id: string
  transaction_time: string
  currency?: string
  merchant_id?: string
  masked_card?: string
  bank?: string
  channel_response_code?: string
  channel_response_message?: string
  permata_va_number?: string
  va_numbers?: Array<{
    bank: string
    va_number: string
  }>
  bill_key?: string
  biller_code?: string
  pdf_url?: string
  qr_code?: string
  store?: string
  settlement_time?: string
  expiry_time?: string
  approval_code?: string
  reference_id?: string
  refund_amount?: string
  refunds?: Array<{
    refund_amount: string
    refund_reason: string
    refund_key: string
  }>
}

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    midtrans: MidtransConfig
  }
}
