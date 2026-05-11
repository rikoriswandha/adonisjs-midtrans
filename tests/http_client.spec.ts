import { test } from '@japa/runner'
import { HttpClient } from '../src/http_client.js'
import { MidtransAPIError, MidtransHTTPError } from '../src/midtrans_error.js'

test.group('HttpClient', (group) => {
  let originalFetch: typeof globalThis.fetch

  group.each.setup(() => {
    originalFetch = globalThis.fetch
  })

  group.each.teardown(() => {
    globalThis.fetch = originalFetch
  })

  test('buildUrl returns sandbox URLs when sandbox=true', ({ assert }) => {
    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    assert.equal(
      client.buildUrl('snap', '/transactions'),
      'https://app.sandbox.midtrans.com/snap/v1/transactions'
    )
    assert.equal(
      client.buildUrl('core', '/v2/charge'),
      'https://api.sandbox.midtrans.com/v2/charge'
    )
    assert.equal(
      client.buildUrl('iris', '/beneficiaries'),
      'https://app.sandbox.midtrans.com/iris/v1/beneficiaries'
    )
  })

  test('buildUrl returns production URLs when sandbox=false', ({ assert }) => {
    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: false,
      timeout: 5000,
      debug: false,
    })

    assert.equal(
      client.buildUrl('snap', '/transactions'),
      'https://app.midtrans.com/snap/v1/transactions'
    )
    assert.equal(client.buildUrl('core', '/v2/charge'), 'https://api.midtrans.com/v2/charge')
    assert.equal(
      client.buildUrl('iris', '/beneficiaries'),
      'https://app.midtrans.com/iris/v1/beneficiaries'
    )
  })

  test('request sends correct Authorization header with base64 encoded serverKey', async ({
    assert,
  }) => {
    let capturedRequest: Request | null = null

    globalThis.fetch = async (input: string | Request | URL, init?: RequestInit) => {
      capturedRequest = new Request(input, init)
      return new Response(JSON.stringify({ token: 'abc123' }), { status: 200 })
    }

    const client = new HttpClient({
      serverKey: 'my-secret-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    await client.request('POST', '/transactions', 'snap', { amount: 10000 })

    assert.isNotNull(capturedRequest)
    const authHeader = capturedRequest!.headers.get('Authorization')
    assert.equal(authHeader, 'Basic ' + Buffer.from('my-secret-key:').toString('base64'))
  })

  test('request sends Content-Type application/json header', async ({ assert }) => {
    let capturedRequest: Request | null = null

    globalThis.fetch = async (input: string | Request | URL, init?: RequestInit) => {
      capturedRequest = new Request(input, init)
      return new Response(JSON.stringify({}), { status: 200 })
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    await client.request('POST', '/transactions', 'snap', { amount: 10000 })

    assert.isNotNull(capturedRequest)
    assert.equal(capturedRequest!.headers.get('Content-Type'), 'application/json')
  })

  test('request returns parsed JSON on success', async ({ assert }) => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({ token: 'snap-token-123', redirect_url: 'https://example.com' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    const result = await client.request('POST', '/transactions', 'snap', { amount: 10000 })
    assert.deepEqual(result, { token: 'snap-token-123', redirect_url: 'https://example.com' })
  })

  test('request without body does not include body in fetch', async ({ assert }) => {
    let capturedInit: RequestInit | undefined

    globalThis.fetch = async (_input: string | Request | URL, init?: RequestInit) => {
      capturedInit = init
      return new Response(JSON.stringify({}), { status: 200 })
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    await client.request('GET', '/v2/abc123/status', 'core')

    assert.isUndefined(capturedInit!.body)
  })

  test('4xx response throws MidtransAPIError with parsed messages', async ({ assert }) => {
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          status_code: '400',
          status_message: 'One or more parameters in the payload is invalid.',
          validation_messages: ['transaction_details.gross_amount is required'],
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    try {
      await client.request('POST', '/transactions', 'snap', { amount: 10000 })
      assert.fail('Expected MidtransAPIError to be thrown')
    } catch (error) {
      assert.instanceOf(error, MidtransAPIError)
      assert.equal(error.statusCode, 400)
      assert.equal(error.statusMessage, 'One or more parameters in the payload is invalid.')
      assert.deepEqual(error.errorMessages, ['transaction_details.gross_amount is required'])
    }
  })

  test('5xx response throws MidtransHTTPError', async ({ assert }) => {
    globalThis.fetch = async () => {
      return new Response('Internal Server Error', { status: 500 })
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    try {
      await client.request('POST', '/transactions', 'snap', { amount: 10000 })
      assert.fail('Expected MidtransHTTPError to be thrown')
    } catch (error) {
      assert.instanceOf(error, MidtransHTTPError)
      assert.equal(error.statusCode, 500)
    }
  })

  test('network/fetch error throws MidtransHTTPError', async ({ assert }) => {
    globalThis.fetch = async () => {
      throw new Error('fetch failed: connection refused')
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    try {
      await client.request('POST', '/transactions', 'snap', { amount: 10000 })
      assert.fail('Expected MidtransHTTPError to be thrown')
    } catch (error) {
      assert.instanceOf(error, MidtransHTTPError)
      assert.include(error.message, 'fetch failed')
    }
  })

  test('timeout triggers AbortController and throws MidtransHTTPError', async ({ assert }) => {
    globalThis.fetch = async (_input: string | Request | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal as AbortSignal
        signal.addEventListener('abort', () => {
          reject(new Error('The operation was aborted'))
        })
      })
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 50,
      debug: false,
    })

    try {
      await client.request('POST', '/transactions', 'snap', { amount: 10000 })
      assert.fail('Expected MidtransHTTPError to be thrown')
    } catch (error) {
      assert.instanceOf(error, MidtransHTTPError)
      assert.include(error.message.toLowerCase(), 'abort')
    }
  })

  test('debug mode logs method, url, and body with serverKey redacted', async ({ assert }) => {
    const logs: string[] = []
    const originalConsoleLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }

    globalThis.fetch = async () => {
      return new Response(JSON.stringify({}), { status: 200 })
    }

    const serverKey = 'my-top-secret-key-12345'
    const client = new HttpClient({
      serverKey,
      sandbox: true,
      timeout: 5000,
      debug: true,
    })

    await client.request('POST', '/transactions', 'snap', {
      amount: 10000,
      serverKey: 'my-top-secret-key-12345',
    })

    console.log = originalConsoleLog

    const logOutput = logs.join('\n')
    assert.isTrue(logOutput.includes('***REDACTED***'))
    assert.isFalse(logOutput.includes(serverKey))
    assert.isTrue(logOutput.includes('POST'))
    assert.isTrue(logOutput.includes('/transactions'))
  })

  test('debug mode does not log when debug=false', async ({ assert }) => {
    const logs: string[] = []
    const originalConsoleLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.join(' '))
    }

    globalThis.fetch = async () => {
      return new Response(JSON.stringify({}), { status: 200 })
    }

    const client = new HttpClient({
      serverKey: 'test-key',
      sandbox: true,
      timeout: 5000,
      debug: false,
    })

    await client.request('POST', '/transactions', 'snap', { amount: 10000 })

    console.log = originalConsoleLog

    assert.equal(logs.length, 0)
  })
})
