import { test } from '@japa/runner'
import crypto from 'node:crypto'
import { validateSignature, parseNotification, isTransactionSuccess } from '../src/webhook.js'
import type { MidtransNotification } from '../src/types.js'

test.group('Webhook utilities', () => {
  const serverKey = 'test-server-key-12345'

  function computeSignature(orderId: string, statusCode: string, grossAmount: string): string {
    const raw = orderId + statusCode + grossAmount + serverKey
    return crypto.createHash('sha512').update(raw).digest('hex')
  }

  test('validateSignature returns true for valid signature', ({ assert }) => {
    const orderId = 'order-123'
    const statusCode = '200'
    const grossAmount = '10000.00'
    const signature = computeSignature(orderId, statusCode, grossAmount)

    const payload: Record<string, string> = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signature,
    }

    assert.isTrue(validateSignature(payload, serverKey))
  })

  test('validateSignature returns false for tampered payload', ({ assert }) => {
    const orderId = 'order-123'
    const statusCode = '200'
    const grossAmount = '10000.00'
    const signature = computeSignature(orderId, statusCode, grossAmount)

    const payload: Record<string, string> = {
      order_id: 'order-456',
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signature,
    }

    assert.isFalse(validateSignature(payload, serverKey))
  })

  test('validateSignature returns false for tampered signature_key', ({ assert }) => {
    const orderId = 'order-123'
    const statusCode = '200'
    const grossAmount = '10000.00'

    const payload: Record<string, string> = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: 'tampered-signature-value',
    }

    assert.isFalse(validateSignature(payload, serverKey))
  })

  test('validateSignature returns false when signature_key is missing', ({ assert }) => {
    const payload: Record<string, string> = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
    }

    assert.isFalse(validateSignature(payload, serverKey))
  })

  test('validateSignature returns false when signature_key is empty string', ({ assert }) => {
    const payload: Record<string, string> = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: '',
    }

    assert.isFalse(validateSignature(payload, serverKey))
  })

  test('validateSignature returns false when order_id is missing', ({ assert }) => {
    const payload: Record<string, string> = {
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'some-key',
    }

    assert.isFalse(validateSignature(payload, serverKey))
  })

  test('validateSignature uses different serverKeys and returns false for wrong key', ({
    assert,
  }) => {
    const orderId = 'order-123'
    const statusCode = '200'
    const grossAmount = '10000.00'
    const signature = computeSignature(orderId, statusCode, grossAmount)

    const payload: Record<string, string> = {
      order_id: orderId,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signature,
    }

    assert.isFalse(validateSignature(payload, 'different-server-key'))
  })

  test('parseNotification returns typed MidtransNotification for valid payload', ({ assert }) => {
    const body = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc123',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    const result = parseNotification(body)

    assert.equal(result.order_id, 'order-123')
    assert.equal(result.transaction_status, 'settlement')
    assert.equal(result.payment_type, 'credit_card')
  })

  test('parseNotification throws when order_id is missing', ({ assert }) => {
    const body = {
      status_code: '200',
      gross_amount: '10000.00',
      transaction_status: 'settlement',
    }

    assert.throws(() => parseNotification(body), 'Invalid notification payload')
  })

  test('parseNotification throws when status_code is missing', ({ assert }) => {
    const body = {
      order_id: 'order-123',
      gross_amount: '10000.00',
      transaction_status: 'settlement',
    }

    assert.throws(() => parseNotification(body), 'Invalid notification payload')
  })

  test('parseNotification throws when transaction_status is missing', ({ assert }) => {
    const body = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
    }

    assert.throws(() => parseNotification(body), 'Invalid notification payload')
  })

  test('isTransactionSuccess returns true for settlement', ({ assert }) => {
    const notification: MidtransNotification = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc',
      transaction_status: 'settlement',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    assert.isTrue(isTransactionSuccess(notification))
  })

  test('isTransactionSuccess returns true for capture', ({ assert }) => {
    const notification: MidtransNotification = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc',
      transaction_status: 'capture',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    assert.isTrue(isTransactionSuccess(notification))
  })

  test('isTransactionSuccess returns false for pending', ({ assert }) => {
    const notification: MidtransNotification = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc',
      transaction_status: 'pending',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    assert.isFalse(isTransactionSuccess(notification))
  })

  test('isTransactionSuccess returns false for deny', ({ assert }) => {
    const notification: MidtransNotification = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc',
      transaction_status: 'deny',
      fraud_status: 'deny',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    assert.isFalse(isTransactionSuccess(notification))
  })

  test('isTransactionSuccess returns false for cancel', ({ assert }) => {
    const notification: MidtransNotification = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc',
      transaction_status: 'cancel',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    assert.isFalse(isTransactionSuccess(notification))
  })

  test('isTransactionSuccess returns false for expire', ({ assert }) => {
    const notification: MidtransNotification = {
      order_id: 'order-123',
      status_code: '200',
      gross_amount: '10000.00',
      signature_key: 'abc',
      transaction_status: 'expire',
      fraud_status: 'accept',
      payment_type: 'credit_card',
      transaction_id: 'txn-001',
      transaction_time: '2025-01-01 10:00:00',
    }

    assert.isFalse(isTransactionSuccess(notification))
  })
})

test('challenged or denied payments are not successful', ({ assert }) => {
  for (const transaction_status of ['capture', 'settlement']) {
    for (const fraud_status of ['challenge', 'deny']) {
      assert.isFalse(
        isTransactionSuccess({ transaction_status, fraud_status } as MidtransNotification)
      )
    }
  }
})
