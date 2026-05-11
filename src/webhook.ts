import crypto from 'node:crypto'
import type { MidtransNotification } from './types.js'

/**
 * Validates Midtrans webhook notification signature using SHA512.
 * Returns false (not throws) on invalid or missing signature.
 */
export function validateSignature(payload: Record<string, string>, serverKey: string): boolean {
  const signatureKey = payload.signature_key
  if (!signatureKey) return false
  if (!payload.order_id || !payload.status_code || !payload.gross_amount) return false

  const raw = payload.order_id + payload.status_code + payload.gross_amount + serverKey
  const hash = crypto.createHash('sha512').update(raw).digest('hex')

  const sigBuf = Buffer.from(signatureKey)
  const hashBuf = Buffer.from(hash)
  if (sigBuf.length !== hashBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, hashBuf)
}

/**
 * Parses a raw webhook body into a typed MidtransNotification.
 * Throws if required fields are missing.
 */
export function parseNotification(body: Record<string, unknown>): MidtransNotification {
  if (!body.order_id || !body.status_code || !body.transaction_status) {
    throw new Error('Invalid notification payload: missing required fields')
  }

  return body as unknown as MidtransNotification
}

/**
 * Returns true for successful transaction statuses: settlement or capture.
 */
export function isTransactionSuccess(notification: MidtransNotification): boolean {
  return (
    notification.transaction_status === 'settlement' ||
    notification.transaction_status === 'capture'
  )
}
