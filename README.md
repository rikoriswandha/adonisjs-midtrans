# @rikoriswandha/adonisjs-midtrans

[![npm version](https://img.shields.io/npm/v/@rikoriswandha/adonisjs-midtrans.svg)](https://www.npmjs.com/package/@rikoriswandha/adonisjs-midtrans) [![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rikoriswandha/adonisjs-midtrans/blob/main/LICENSE.md) [![node](https://img.shields.io/node/v/@rikoriswandha/adonisjs-midtrans.svg)](https://nodejs.org)

AdonisJS v7 package for Midtrans payment gateway integration. Supports Snap checkout, Core API (credit card, bank transfer, e-wallet, c-store, BNPL), transaction management, Iris disbursement, and webhook verification.

## Requirements

- Node.js >= 24
- AdonisJS v7

## Installation

```bash
npm install @rikoriswandha/adonisjs-midtrans
node ace configure @rikoriswandha/adonisjs-midtrans
```

## Configuration

### Environment variables

Add these to your `.env` file:

```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IRIS_KEY=your-iris-key          # optional, only for disbursement
MIDTRANS_SANDBOX=true                    # true for sandbox, false for production
MIDTRANS_TIMEOUT=30000                   # request timeout in ms (minimum 1000)
MIDTRANS_DEBUG=false                     # enable HTTP request logging
```

Update `env.ts` to validate them:

```typescript
export default Env.create(new URL('.', import.meta.url), {
  MIDTRANS_SERVER_KEY: Env.schema.string(),
  MIDTRANS_CLIENT_KEY: Env.schema.string.optional(),
  MIDTRANS_IRIS_KEY: Env.schema.string.optional(),
  MIDTRANS_SANDBOX: Env.schema.boolean(),
  MIDTRANS_TIMEOUT: Env.schema.number.optional(),
  MIDTRANS_DEBUG: Env.schema.boolean.optional(),
})
```

### Config file

The config lives in `config/midtrans.ts`. Use the `defineConfig` helper for type safety and validation:

```typescript
import { defineConfig } from '@rikoriswandha/adonisjs-midtrans/define_config'
import env from '#start/env'

export default defineConfig({
  serverKey: env.get('MIDTRANS_SERVER_KEY'),
  clientKey: env.get('MIDTRANS_CLIENT_KEY'),
  irisKey: env.get('MIDTRANS_IRIS_KEY'),
  sandbox: env.get('MIDTRANS_SANDBOX'),
  timeout: env.get('MIDTRANS_TIMEOUT'),
  debug: env.get('MIDTRANS_DEBUG'),
})
```

`defineConfig` validates your input and applies defaults:

| Option      | Required | Default   | Description                           |
| ----------- | -------- | --------- | ------------------------------------- |
| `serverKey` | yes      | -         | Midtrans server key                   |
| `clientKey` | no       | undefined | Midtrans client key                   |
| `irisKey`   | no       | undefined | Iris API key (enables disbursement)   |
| `sandbox`   | no       | `false`   | Use sandbox environment               |
| `timeout`   | no       | `30000`   | HTTP request timeout in ms (min 1000) |
| `debug`     | no       | `false`   | Log HTTP requests (keys redacted)     |

## Usage

Resolve the Midtrans manager from the IoC container:

```typescript
import { MidtransManager } from '@rikoriswandha/adonisjs-midtrans'

const midtrans = await app.container.make(MidtransManager)
```

The manager exposes three clients: `snap`, `core`, and `iris` (optional).

### Snap (redirect checkout)

Create a Snap transaction and redirect the user to the payment page:

```typescript
const response = await midtrans.snap.createTransaction({
  transaction_details: {
    order_id: 'ORDER-123',
    gross_amount: 50000,
  },
  item_details: [{ id: 'item-1', price: 50000, quantity: 1, name: 'Coffee Beans' }],
  customer_details: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+6281234567890',
  },
})

// response.token - pass to MidtransSnap.js on frontend
// response.redirect_url - redirect user here
```

You can also restrict payment methods with `enabled_payments`:

```typescript
const response = await midtrans.snap.createTransaction({
  transaction_details: { order_id: 'ORDER-124', gross_amount: 100000 },
  enabled_payments: ['gopay', 'bca_va', 'indomaret'],
})
```

### Core API

The Core API gives you full control over individual payment methods.

#### Credit card

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createCreditCardCharge('ORDER-200', 100000, {
    token_id: 'token-from-midtrans-js',
    secure: true,
  })
)
```

#### Bank transfer (virtual account)

Supports BCA, BNI, BRI, Mandiri, Permata, and CIMB:

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createBankTransferCharge('ORDER-201', 75000, 'bca')
)

// With a custom VA number:
const charge2 = await midtrans.core.charge(
  midtrans.core.createBankTransferCharge('ORDER-202', 75000, 'bca', '111222333444')
)
```

#### GoPay

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createGoPayCharge('ORDER-203', 50000, 'https://myapp.com/gopay-callback')
)
```

#### ShopeePay

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createShopeepayCharge('ORDER-204', 60000, 'https://myapp.com/shopeepay-callback')
)
```

#### QRIS

```typescript
const charge = await midtrans.core.charge(midtrans.core.createQrisCharge('ORDER-205', 25000))
```

#### Convenience store (Indomaret / Alfamart)

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createCStoreCharge('ORDER-206', 30000, 'indomaret', 'Payment for order 206')
)
```

#### BNPL (Akulaku / Kredivo)

```typescript
const charge = await midtrans.core.charge(midtrans.core.createAkulakuCharge('ORDER-207', 200000))

const charge2 = await midtrans.core.charge(midtrans.core.createKredivoCharge('ORDER-208', 150000))
```

### Transaction management

```typescript
// Check status
const status = await midtrans.core.status('ORDER-123')

// Cancel a transaction
await midtrans.core.cancel('ORDER-123')

// Refund (full or partial)
await midtrans.core.refund('ORDER-123')
await midtrans.core.refund('ORDER-123', { amount: 50000, reason: 'Partial refund' })

// Expire a pending transaction
await midtrans.core.expire('ORDER-123')

// Approve a challenged transaction
await midtrans.core.approve('ORDER-123')
```

### Iris disbursement

Iris is only available when `irisKey` is configured. The `midtrans.iris` property will be `undefined` otherwise.

```typescript
if (midtrans.iris) {
  const disbursement = await midtrans.iris.createDisbursement({
    bank_account: {
      bank: 'bca',
      account: '1234567890',
      name: 'John Doe',
    },
    amount: 1000000,
    reference_no: 'DISB-001',
    notes: 'March payout',
  })

  // Check status
  const status = await midtrans.iris.getDisbursementStatus(disbursement.disbursement_id)

  // Approve with OTP
  await midtrans.iris.approveDisbursement({
    disbursement_id: disbursement.disbursement_id,
    otp: '123456',
  })
}
```

### Webhook handling

Import helpers from the package to verify and parse incoming notifications:

```typescript
import {
  validateSignature,
  parseNotification,
  isTransactionSuccess,
} from '@rikoriswandha/adonisjs-midtrans'
```

In your webhook route:

```typescript
router.post('/midtrans/webhook', async ({ request, response, env }) => {
  const body = request.body() as Record<string, string>

  // Verify the signature first
  const isValid = validateSignature(body, env.get('MIDTRANS_SERVER_KEY'))
  if (!isValid) {
    return response.unauthorized('Invalid signature')
  }

  // Parse into typed notification
  const notification = parseNotification(body)

  // Handle based on transaction status
  if (isTransactionSuccess(notification)) {
    // Fulfill the order
    await Order.markPaid(notification.order_id)
  }
})
```

`isTransactionSuccess` returns `true` when `transaction_status` is `"settlement"` or `"capture"`. These are the only statuses where you should fulfill an order.

## Error handling

The package provides a typed error hierarchy. All errors extend `MidtransError`.

| Error class               | When it occurs                                |
| ------------------------- | --------------------------------------------- |
| `MidtransError`           | Base class for all Midtrans errors            |
| `MidtransHTTPError`       | Network or server errors (5xx, timeouts)      |
| `MidtransAPIError`        | Midtrans API rejections (4xx with validation) |
| `MidtransValidationError` | Invalid config input in `defineConfig`        |
| `MidtransSignatureError`  | Webhook signature verification failure        |

Catch specific errors to handle different failure modes:

```typescript
import {
  MidtransAPIError,
  MidtransHTTPError,
  MidtransValidationError,
} from '@rikoriswandha/adonisjs-midtrans'

try {
  const charge = await midtrans.core.charge(params)
} catch (error) {
  if (error instanceof MidtransAPIError) {
    // Midtrans rejected the request
    console.log(error.statusCode) // e.g. 400
    console.log(error.statusMessage) // e.g. "Invalid transaction details"
    console.log(error.errorMessages) // e.g. ["gross_amount is required"]
  } else if (error instanceof MidtransHTTPError) {
    // Network or server error
    console.log(error.statusCode) // e.g. 500
    console.log(error.requestUrl) // the URL that failed
    console.log(error.requestMethod) // "POST"
  } else if (error instanceof MidtransValidationError) {
    // Config validation failed
    console.log(error.field) // e.g. "serverKey"
  }
}
```

All error `toJSON()` methods exclude sensitive data like server keys.

## Safe config access

Use `safeConfig` to expose configuration without leaking keys:

```typescript
const config = midtrans.safeConfig
// { sandbox: true, timeout: 30000, debug: false }
// serverKey and irisKey are excluded
```

## Links

- [Midtrans official documentation](https://docs.midtrans.com/)
- [Midtrans API reference](https://api-docs.midtrans.com/)
- [GitHub repository](https://github.com/rikoriswandha/adonisjs-midtrans)
- [Report an issue](https://github.com/rikoriswandha/adonisjs-midtrans/issues)

## License

MIT. See [LICENSE.md](./LICENSE.md) for details.
