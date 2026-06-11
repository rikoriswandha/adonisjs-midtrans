import { test } from '@japa/runner'
import { HttpClient } from '../src/http_client.js'
import { CoreClient } from '../src/core_client.js'
import type {
  CreditCardCharge,
  BankTransferCharge,
  GopayCharge,
  ShopeepayCharge,
  QrisCharge,
  CstoreCharge,
  AkulakuCharge,
  KredivoCharge,
} from '../src/types.js'

test.group('CoreClient', () => {
  function createMockClient(response: Record<string, unknown> = {}): {
    core: CoreClient
    captured: { method?: string; url?: string; body?: unknown }
  } {
    const captured: { method?: string; url?: string; body?: unknown } = {}

    globalThis.fetch = async (input: string | Request | URL, init?: RequestInit) => {
      captured.method = init?.method ?? 'GET'
      captured.url = typeof input === 'string' ? input : input.toString()
      captured.body = init?.body ? JSON.parse(init.body as string) : undefined
      return new Response(JSON.stringify(response), { status: 200 })
    }

    const http = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const core = new CoreClient(http)
    return { core, captured }
  }

  test('status calls GET /v2/{orderId}/status', async ({ assert }) => {
    const { core, captured } = createMockClient({
      status_code: '200',
      status_message: 'Success',
      transaction_status: 'settlement',
      order_id: 'order-1',
      gross_amount: '10000.00',
      payment_type: 'credit_card',
      transaction_time: '2025-01-01 00:00:00',
      fraud_status: 'accept',
    })

    const result = await core.status('order-1')

    assert.equal(captured.method, 'GET')
    assert.include(captured.url!, '/v2/order-1/status')
    assert.equal(result.transaction_status, 'settlement')
  })

  test('cancel calls POST /v2/{orderId}/cancel', async ({ assert }) => {
    const { core, captured } = createMockClient({
      status_code: '200',
      status_message: 'Success',
      order_id: 'order-1',
      gross_amount: '10000.00',
      payment_type: 'credit_card',
      transaction_time: '2025-01-01 00:00:00',
      transaction_status: 'cancel',
      fraud_status: 'accept',
    })

    const result = await core.cancel('order-1')

    assert.equal(captured.method, 'POST')
    assert.include(captured.url!, '/v2/order-1/cancel')
    assert.isUndefined(captured.body)
    assert.equal(result.transaction_status, 'cancel')
  })

  test('refund calls POST /v2/{orderId}/refund with body', async ({ assert }) => {
    const { core, captured } = createMockClient({
      status_code: '200',
      status_message: 'Success',
      order_id: 'order-1',
      gross_amount: '10000.00',
      payment_type: 'credit_card',
      transaction_time: '2025-01-01 00:00:00',
      transaction_status: 'refund',
      fraud_status: 'accept',
      refund_amount: '5000.00',
      refund_key: 'refund-123',
    })

    const result = await core.refund('order-1', { amount: 5000, reason: 'Customer request' })

    assert.equal(captured.method, 'POST')
    assert.include(captured.url!, '/v2/order-1/refund')
    assert.deepEqual(captured.body, { amount: 5000, reason: 'Customer request' })
    assert.equal(result.refund_amount, '5000.00')
  })

  test('refund without params sends POST with no body', async ({ assert }) => {
    const { core, captured } = createMockClient({
      status_code: '200',
      status_message: 'Success',
      order_id: 'order-1',
      gross_amount: '10000.00',
      payment_type: 'credit_card',
      transaction_time: '2025-01-01 00:00:00',
      transaction_status: 'refund',
      fraud_status: 'accept',
    })

    await core.refund('order-1')

    assert.equal(captured.method, 'POST')
    assert.include(captured.url!, '/v2/order-1/refund')
    assert.isUndefined(captured.body)
  })

  test('expire calls POST /v2/{orderId}/expire', async ({ assert }) => {
    const { core, captured } = createMockClient({
      status_code: '200',
      status_message: 'Success',
      order_id: 'order-1',
      gross_amount: '10000.00',
      payment_type: 'credit_card',
      transaction_time: '2025-01-01 00:00:00',
      transaction_status: 'expire',
      fraud_status: 'accept',
    })

    const result = await core.expire('order-1')

    assert.equal(captured.method, 'POST')
    assert.include(captured.url!, '/v2/order-1/expire')
    assert.isUndefined(captured.body)
    assert.equal(result.transaction_status, 'expire')
  })

  test('approve calls POST /v2/{orderId}/approve', async ({ assert }) => {
    const { core, captured } = createMockClient({
      status_code: '200',
      status_message: 'Success',
      order_id: 'order-1',
      gross_amount: '10000.00',
      payment_type: 'credit_card',
      transaction_time: '2025-01-01 00:00:00',
      transaction_status: 'approve',
      fraud_status: 'accept',
    })

    const result = await core.approve('order-1')

    assert.equal(captured.method, 'POST')
    assert.include(captured.url!, '/v2/order-1/approve')
    assert.isUndefined(captured.body)
    assert.equal(result.transaction_status, 'approve')
  })

  test('createCreditCardCharge builds correct request', ({ assert }) => {
    const { core } = createMockClient()
    const cardDetails = {
      card_number: '4111111111111111',
      exp_month: '12',
      exp_year: '2027',
      cvv: '123',
    }

    const result = core.createCreditCardCharge('order-1', 10000, cardDetails) as CreditCardCharge

    assert.equal(result.payment_type, 'credit_card')
    assert.equal(result.transaction_details.order_id, 'order-1')
    assert.equal(result.transaction_details.gross_amount, 10000)
    assert.deepEqual(result.credit_card, cardDetails)
  })

  test('createBankTransferCharge builds correct request without vaNumber', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createBankTransferCharge('order-1', 50000, 'bca') as BankTransferCharge

    assert.equal(result.payment_type, 'bank_transfer')
    assert.equal(result.bank_transfer.bank, 'bca')
    assert.isUndefined(result.bank_transfer.va_number)
  })

  test('createBankTransferCharge builds correct request with vaNumber', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createBankTransferCharge(
      'order-1',
      50000,
      'bca',
      '1234567890'
    ) as BankTransferCharge

    assert.equal(result.payment_type, 'bank_transfer')
    assert.equal(result.bank_transfer.bank, 'bca')
    assert.equal(result.bank_transfer.va_number, '1234567890')
  })

  test('createGoPayCharge builds correct request without callback', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createGoPayCharge('order-1', 25000) as GopayCharge

    assert.equal(result.payment_type, 'gopay')
    assert.equal(result.gopay.provider, 'gopay')
    assert.isUndefined(result.gopay.callback_url)
    assert.isUndefined(result.gopay.enable_callback)
  })

  test('createGoPayCharge builds correct request with callback', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createGoPayCharge(
      'order-1',
      25000,
      'https://example.com/callback'
    ) as GopayCharge

    assert.equal(result.payment_type, 'gopay')
    assert.equal(result.gopay.callback_url, 'https://example.com/callback')
    assert.isTrue(result.gopay.enable_callback)
  })

  test('createShopeepayCharge builds correct request without callback', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createShopeepayCharge('order-1', 30000) as ShopeepayCharge

    assert.equal(result.payment_type, 'shopeepay')
    assert.equal(result.shopeepay.provider, 'shopeepay')
    assert.isUndefined(result.shopeepay.callback_url)
  })

  test('createShopeepayCharge builds correct request with callback', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createShopeepayCharge(
      'order-1',
      30000,
      'https://example.com/callback'
    ) as ShopeepayCharge

    assert.equal(result.payment_type, 'shopeepay')
    assert.equal(result.shopeepay.callback_url, 'https://example.com/callback')
    assert.isTrue(result.shopeepay.enable_callback)
  })

  test('createQrisCharge builds correct request', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createQrisCharge('order-1', 15000) as QrisCharge

    assert.equal(result.payment_type, 'qris')
    assert.equal(result.qris.provider, 'qris')
    assert.equal(result.transaction_details.order_id, 'order-1')
    assert.equal(result.transaction_details.gross_amount, 15000)
  })

  test('createCStoreCharge builds correct request without message', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createCStoreCharge('order-1', 75000, 'indomaret') as CstoreCharge

    assert.equal(result.payment_type, 'cstore')
    assert.equal(result.cstore.store, 'indomaret')
    assert.isUndefined(result.cstore.message)
  })

  test('createCStoreCharge builds correct request with message', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createCStoreCharge(
      'order-1',
      75000,
      'alfamart',
      'Pay at store'
    ) as CstoreCharge

    assert.equal(result.payment_type, 'cstore')
    assert.equal(result.cstore.store, 'alfamart')
    assert.equal(result.cstore.message, 'Pay at store')
  })

  test('createAkulakuCharge builds correct request', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createAkulakuCharge('order-1', 100000) as AkulakuCharge

    assert.equal(result.payment_type, 'akulaku')
    assert.equal(result.akulaku.provider, 'akulaku')
    assert.equal(result.transaction_details.order_id, 'order-1')
  })

  test('createKredivoCharge builds correct request', ({ assert }) => {
    const { core } = createMockClient()

    const result = core.createKredivoCharge('order-1', 200000) as KredivoCharge

    assert.equal(result.payment_type, 'kredivo')
    assert.equal(result.kredivo.provider, 'kredivo')
    assert.equal(result.transaction_details.order_id, 'order-1')
  })
})
