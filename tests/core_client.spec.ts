import { test } from '@japa/runner'
import { HttpClient } from '../src/http_client.js'
import { CoreClient } from '../src/core_client.js'

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
})
