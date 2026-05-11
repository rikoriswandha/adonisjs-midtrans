import { test } from '@japa/runner'
import { SnapClient } from '../src/snap_client.js'
import { HttpClient } from '../src/http_client.js'
import { MidtransAPIError } from '../src/midtrans_error.js'
import type { SnapTransactionRequest, SnapTransactionResponse } from '../src/types.js'

test.group('SnapClient', (group) => {
  let originalFetch: typeof globalThis.fetch

  group.each.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.each.teardown(() => {
    globalThis.fetch = originalFetch
  })

  test('createTransaction calls correct endpoint with correct parameters', async ({ assert }) => {
    let capturedRequest: Request | null = null

    globalThis.fetch = async (input, init) => {
      capturedRequest = new Request(input, init)
      return new Response(
        JSON.stringify({ token: 'test-token', redirect_url: 'https://example.com' }),
        { status: 200 }
      )
    }

    const httpClient = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const client = new SnapClient(httpClient)
    const params: SnapTransactionRequest = {
      transaction_details: { order_id: 'order-123', gross_amount: 10000 },
    }

    await client.createTransaction(params)

    assert.isNotNull(capturedRequest)
    assert.equal(capturedRequest!.url, 'https://app.sandbox.midtrans.com/snap/v1/transactions')
    assert.equal(capturedRequest!.method, 'POST')
    assert.equal(capturedRequest!.headers.get('Content-Type'), 'application/json')
  })

  test('createTransaction returns token and redirect_url', async ({ assert }) => {
    const mockResponse: SnapTransactionResponse = {
      token: 'test-token-123',
      redirect_url: 'https://app.midtrans.com/snap/v1/transactions/123',
    }

    globalThis.fetch = async () => {
      return new Response(JSON.stringify(mockResponse), { status: 200 })
    }

    const httpClient = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const client = new SnapClient(httpClient)
    const params: SnapTransactionRequest = {
      transaction_details: { order_id: 'order-123', gross_amount: 10000 },
    }

    const result = await client.createTransaction(params)

    assert.equal(result.token, 'test-token-123')
    assert.equal(result.redirect_url, 'https://app.midtrans.com/snap/v1/transactions/123')
  })

  test('createTransaction forwards request body correctly', async ({ assert }) => {
    let capturedBody: string | null = null

    globalThis.fetch = async (_input, init) => {
      capturedBody = (init?.body as string) ?? null
      return new Response(
        JSON.stringify({ token: 'test-token', redirect_url: 'https://example.com' }),
        { status: 200 }
      )
    }

    const httpClient = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const client = new SnapClient(httpClient)
    const params: SnapTransactionRequest = {
      transaction_details: { order_id: 'order-123', gross_amount: 10000 },
      customer_details: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      enabled_payments: ['gopay', 'bank_transfer'],
      custom_field1: 'custom-value',
    }

    await client.createTransaction(params)

    assert.deepEqual(JSON.parse(capturedBody!), params)
  })

  test('API errors propagate correctly as MidtransAPIError', async ({ assert }) => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status_message: 'Bad request',
          validation_messages: ['validation error'],
        }),
        { status: 400, statusText: 'Bad Request' }
      )
    }

    const httpClient = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const client = new SnapClient(httpClient)
    const params: SnapTransactionRequest = {
      transaction_details: { order_id: 'order-123', gross_amount: 10000 },
    }

    assert.rejects(async () => {
      await client.createTransaction(params)
    }, MidtransAPIError)
  })
})
