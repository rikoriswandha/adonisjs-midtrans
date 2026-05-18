import { test } from '@japa/runner'
import {
  MidtransError,
  MidtransHTTPError,
  MidtransAPIError,
  MidtransValidationError,
  MidtransSignatureError,
} from '../src/midtrans_error.js'

test.group('MidtransError', () => {
  test('toJSON returns name, message, stack, statusCode, apiResponse', ({ assert }) => {
    const error = new MidtransError('something broke')
    error.statusCode = 500
    error.apiResponse = '{"error": true}'

    const json = error.toJSON() as Record<string, unknown>

    assert.equal(json.name, 'MidtransError')
    assert.equal(json.message, 'something broke')
    assert.isString(json.stack)
    assert.equal(json.statusCode, 500)
    assert.equal(json.apiResponse, '{"error": true}')
  })

  test('toJSON handles undefined statusCode and apiResponse', ({ assert }) => {
    const error = new MidtransError('basic error')

    const json = error.toJSON() as Record<string, unknown>

    assert.isUndefined(json.statusCode)
    assert.isUndefined(json.apiResponse)
  })
})

test.group('MidtransHTTPError', () => {
  test('toJSON includes requestUrl and requestMethod', ({ assert }) => {
    const error = new MidtransHTTPError(
      404,
      'https://api.midtrans.com/v2/charge',
      'POST',
      'Not Found'
    )

    const json = error.toJSON() as Record<string, unknown>

    assert.equal(json.name, 'MidtransHTTPError')
    assert.equal(json.message, 'Not Found')
    assert.equal(json.statusCode, 404)
    assert.equal(json.requestUrl, 'https://api.midtrans.com/v2/charge')
    assert.equal(json.requestMethod, 'POST')
    assert.isString(json.stack)
  })

  test('constructor sets all properties correctly', ({ assert }) => {
    const error = new MidtransHTTPError(500, 'https://example.com', 'GET', 'Server Error')

    assert.equal(error.name, 'MidtransHTTPError')
    assert.equal(error.statusCode, 500)
    assert.equal(error.requestUrl, 'https://example.com')
    assert.equal(error.requestMethod, 'GET')
    assert.equal(error.message, 'Server Error')
    assert.instanceOf(error, MidtransError)
  })
})

test.group('MidtransAPIError', () => {
  test('toJSON includes statusMessage and errorMessages', ({ assert }) => {
    const error = new MidtransAPIError(400, 'Bad Request', ['field X is required', 'invalid amount'])

    const json = error.toJSON() as Record<string, unknown>

    assert.equal(json.name, 'MidtransAPIError')
    assert.equal(json.message, 'Bad Request')
    assert.equal(json.statusCode, 400)
    assert.equal(json.statusMessage, 'Bad Request')
    assert.deepEqual(json.errorMessages, ['field X is required', 'invalid amount'])
  })

  test('constructor sets all properties correctly', ({ assert }) => {
    const error = new MidtransAPIError(422, 'Validation Failed', ['missing order_id'])

    assert.equal(error.name, 'MidtransAPIError')
    assert.equal(error.statusCode, 422)
    assert.equal(error.statusMessage, 'Validation Failed')
    assert.deepEqual(error.errorMessages, ['missing order_id'])
    assert.instanceOf(error, MidtransError)
  })
})

test.group('MidtransValidationError', () => {
  test('toJSON includes field name', ({ assert }) => {
    const error = new MidtransValidationError('serverKey', 'is required')

    const json = error.toJSON() as Record<string, unknown>

    assert.equal(json.name, 'MidtransValidationError')
    assert.equal(json.message, 'is required')
    assert.equal(json.field, 'serverKey')
  })

  test('constructor sets field and message', ({ assert }) => {
    const error = new MidtransValidationError('timeout', 'must be at least 1000ms')

    assert.equal(error.name, 'MidtransValidationError')
    assert.equal(error.field, 'timeout')
    assert.equal(error.message, 'must be at least 1000ms')
    assert.instanceOf(error, MidtransError)
  })
})

test.group('MidtransSignatureError', () => {
  test('toJSON returns error details without sensitive data', ({ assert }) => {
    const error = new MidtransSignatureError('Invalid webhook signature')

    const json = error.toJSON() as Record<string, unknown>

    assert.equal(json.name, 'MidtransSignatureError')
    assert.equal(json.message, 'Invalid webhook signature')
    assert.isString(json.stack)
    assert.isUndefined((json as Record<string, unknown>).statusCode)
  })

  test('constructor sets message correctly', ({ assert }) => {
    const error = new MidtransSignatureError('Signature mismatch')

    assert.equal(error.name, 'MidtransSignatureError')
    assert.equal(error.message, 'Signature mismatch')
    assert.instanceOf(error, MidtransError)
  })
})
