import { test } from '@japa/runner'
import { HttpClient } from '../src/http_client.js'
import { IrisClient } from '../src/iris_client.js'
import type { DisbursementRequest, DisbursementApprovalRequest } from '../src/types.js'

test.group('IrisClient', () => {
  function createMockClient(
    response: Record<string, unknown> = {},
    config: { serverKey?: string; irisKey?: string } = {}
  ): {
    iris: IrisClient
    captured: { method?: string; url?: string; body?: unknown; authHeader?: string | null }
  } {
    const captured: { method?: string; url?: string; body?: unknown; authHeader?: string | null } =
      {}

    globalThis.fetch = async (input: string | Request | URL, init?: RequestInit) => {
      captured.method = init?.method ?? 'GET'
      captured.url = typeof input === 'string' ? input : input.toString()
      captured.body = init?.body ? JSON.parse(init.body as string) : undefined
      captured.authHeader = init?.headers
        ? ((init.headers as Record<string, string>)['Authorization'] ?? null)
        : null
      return new Response(JSON.stringify(response), { status: 200 })
    }

    const http = new HttpClient({
      serverKey: config.serverKey ?? 'server-key',
      irisKey: config.irisKey,
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const iris = new IrisClient(http)
    return { iris, captured }
  }

  test('createDisbursement calls POST /api/v1/disbursements with iris api', async ({ assert }) => {
    const { iris, captured } = createMockClient({
      disbursement_id: 'disb-123',
      reference_no: 'ref-456',
      status: 'pending',
      amount: '100000.00',
      beneficiary_name: 'John Doe',
      beneficiary_account: '1234567890',
      beneficiary_bank: 'bca',
      notes: 'Salary payment',
      created_at: '2025-01-01T00:00:00Z',
    })

    const params: DisbursementRequest = {
      bank_account: { bank: 'bca', account: '1234567890', name: 'John Doe' },
      amount: 100000,
      notes: 'Salary payment',
      reference_no: 'ref-456',
    }

    const result = await iris.createDisbursement(params)

    assert.equal(captured.method, 'POST')
    assert.equal(captured.url, 'https://app.sandbox.midtrans.com/iris/v1/api/v1/disbursements')
    assert.deepEqual(captured.body, params)
    assert.equal(result.disbursement_id, 'disb-123')
    assert.equal(result.reference_no, 'ref-456')
    assert.equal(result.status, 'pending')
  })

  test('getDisbursementStatus calls GET with disbursement ID', async ({ assert }) => {
    const { iris, captured } = createMockClient({
      status: 'completed',
      amount: '100000.00',
      bank_account: { bank: 'bca', account: '1234567890', name: 'John Doe' },
      reference_no: 'ref-456',
      disbursement_id: 'disb-123',
      disbursement_type: 'bank_transfer',
      notes: 'Salary payment',
      created_at: '2025-01-01T00:00:00Z',
    })

    const result = await iris.getDisbursementStatus('disb-123')

    assert.equal(captured.method, 'GET')
    assert.equal(
      captured.url,
      'https://app.sandbox.midtrans.com/iris/v1/api/v1/disbursements/disb-123'
    )
    assert.isUndefined(captured.body)
    assert.equal(result.status, 'completed')
    assert.equal(result.disbursement_id, 'disb-123')
  })

  test('approveDisbursement calls POST /api/v1/disbursements/approve', async ({ assert }) => {
    const { iris, captured } = createMockClient({
      disbursement_id: 'disb-123',
      reference_no: 'ref-456',
      status: 'approved',
      amount: '100000.00',
      beneficiary_name: 'John Doe',
      beneficiary_account: '1234567890',
      beneficiary_bank: 'bca',
      created_at: '2025-01-01T00:00:00Z',
    })

    const params: DisbursementApprovalRequest = {
      disbursement_id: 'disb-123',
      otp: '123456',
    }

    const result = await iris.approveDisbursement(params)

    assert.equal(captured.method, 'POST')
    assert.equal(
      captured.url,
      'https://app.sandbox.midtrans.com/iris/v1/api/v1/disbursements/approve'
    )
    assert.deepEqual(captured.body, params)
    assert.equal(result.status, 'approved')
    assert.equal(result.disbursement_id, 'disb-123')
  })

  test('iris uses separate irisKey auth instead of serverKey', async ({ assert }) => {
    const { iris, captured } = createMockClient(
      {
        disbursement_id: 'disb-123',
        reference_no: 'ref-456',
        status: 'pending',
        amount: '100000.00',
        beneficiary_name: 'John Doe',
        beneficiary_account: '1234567890',
        beneficiary_bank: 'bca',
        created_at: '2025-01-01T00:00:00Z',
      },
      { serverKey: 'server-key-123', irisKey: 'iris-key-456' }
    )

    const params: DisbursementRequest = {
      bank_account: { bank: 'bca', account: '1234567890', name: 'John Doe' },
      amount: 100000,
    }

    await iris.createDisbursement(params)

    assert.isNotNull(captured.authHeader)
    const expectedAuth = 'Basic ' + Buffer.from('iris-key-456:').toString('base64')
    assert.equal(captured.authHeader, expectedAuth)
  })

  test('iris falls back to serverKey when irisKey is not configured', async ({ assert }) => {
    const { iris, captured } = createMockClient(
      {
        disbursement_id: 'disb-123',
        reference_no: 'ref-456',
        status: 'pending',
        amount: '100000.00',
        beneficiary_name: 'John Doe',
        beneficiary_account: '1234567890',
        beneficiary_bank: 'bca',
        created_at: '2025-01-01T00:00:00Z',
      },
      { serverKey: 'server-key-123' }
    )

    const params: DisbursementRequest = {
      bank_account: { bank: 'bca', account: '1234567890', name: 'John Doe' },
      amount: 100000,
    }

    await iris.createDisbursement(params)

    assert.isNotNull(captured.authHeader)
    const expectedAuth = 'Basic ' + Buffer.from('server-key-123:').toString('base64')
    assert.equal(captured.authHeader, expectedAuth)
  })
})
