# Webhooks guide

Midtrans sends HTTP POST notifications to your server when a transaction changes status. You must verify the signature before trusting the payload.

## Route setup

Create a public route (no auth) that accepts POST requests:

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'

router.post('/midtrans/webhook', '#controllers/webhooks_controller.handle')
```

## Controller implementation

```typescript
// app/controllers/webhooks_controller.ts
import {
  validateSignature,
  parseNotification,
  isTransactionSuccess,
  isTransactionPending,
  isTransactionFailure,
} from '@rikology/adonisjs-midtrans'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class WebhooksController {
  async handle({ request, response }: HttpContext) {
    const body = request.body() as Record<string, string>

    // 1. Verify signature
    const isValid = validateSignature(body, env.get('MIDTRANS_SERVER_KEY'))
    if (!isValid) {
      return response.unauthorized('Invalid signature')
    }

    // 2. Parse into typed notification
    const notification = parseNotification(body)

    // 3. Handle based on status
    if (isTransactionSuccess(notification)) {
      await this.handleSuccess(notification)
    } else if (isTransactionPending(notification)) {
      await this.handlePending(notification)
    } else if (isTransactionFailure(notification)) {
      await this.handleFailure(notification)
    }

    // Always return 200 so Midtrans stops retrying
    return response.ok('OK')
  }

  private async handleSuccess(notification: any) {
    // Fulfill the order
    const order = await Order.findBy('orderId', notification.order_id)
    if (order && order.status === 'pending') {
      order.status = 'paid'
      order.paymentType = notification.payment_type
      order.transactionId = notification.transaction_id
      await order.save()
    }
  }

  private async handlePending(notification: any) {
    // Log or notify customer
    console.log(`Payment pending for ${notification.order_id}`)
  }

  private async handleFailure(notification: any) {
    // Mark order as failed
    const order = await Order.findBy('orderId', notification.order_id)
    if (order) {
      order.status = 'failed'
      await order.save()
    }
  }
}
```

> Always return HTTP 200. If you return 4xx/5xx, Midtrans will retry the notification.

## Status helpers

The package exports three status predicates:

| Function                  | Matches                          |
| ------------------------- | -------------------------------- |
| `isTransactionSuccess`    | `settlement`, `capture`          |
| `isTransactionPending`    | `pending`                        |
| `isTransactionFailure`    | `deny`, `expire`, `cancel`, `failure` |

Import them alongside `validateSignature` and `parseNotification`:

```typescript
import {
  validateSignature,
  parseNotification,
  isTransactionSuccess,
  isTransactionPending,
  isTransactionFailure,
} from '@rikology/adonisjs-midtrans'
```

## Notification fields

Common fields in a `MidtransNotification`:

| Field                | Description                                    |
| -------------------- | ---------------------------------------------- |
| `transaction_time`   | Timestamp of the transaction                   |
| `transaction_status` | Current status                                 |
| `transaction_id`     | Midtrans transaction ID                        |
| `order_id`           | Your order ID                                  |
| `payment_type`       | Payment method used                            |
| `gross_amount`       | Total amount                                   |
| `fraud_status`       | Fraud detection result (`accept`, `deny`, etc) |
| `signature_key`      | SHA512 signature for verification              |
| `status_code`        | HTTP status code of the notification           |

## Signature verification

`validateSignature` compares the `signature_key` in the payload against a SHA512 hash computed from:

```
order_id + status_code + gross_amount + serverKey
```

It uses constant-time comparison (`timingSafeEqual`) to prevent timing attacks. The function returns `false` (does not throw) for invalid or missing signatures.

## Idempotency

Midtrans may send duplicate notifications. Guard against double-processing:

```typescript
private async handleSuccess(notification: any) {
  const order = await Order.findBy('orderId', notification.order_id)
  if (!order || order.status !== 'pending') {
    return // Already processed or unknown order
  }

  order.status = 'paid'
  order.transactionId = notification.transaction_id
  await order.save()
}
```

## Testing webhooks locally

Use a tunnel like [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3333
```

Then set the webhook URL in your Midtrans dashboard to:

```
https://your-ngrok-url.ngrok.io/midtrans/webhook
```

## See also

- [Midtrans notification flow](https://docs.midtrans.com/reference/http-notification-overview)
- [Transaction status reference](https://docs.midtrans.com/reference/transaction-status)
