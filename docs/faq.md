# FAQ & troubleshooting

## General

### Which Midtrans APIs does this package support?

- **Snap** – redirect checkout
- **Core API** – direct charge for credit card, bank transfer, e-wallet, QRIS, convenience store, BNPL
- **Iris** – disbursement/payouts (optional, requires `irisKey`)

### Do I need both Snap and Core API?

No. Choose based on your use case:

- **Snap** – Easiest. One call gets you a token; Midtrans handles the payment UI.
- **Core API** – More control. You build your own UI and call specific payment methods.

You can use both in the same project.

### Can I use this with AdonisJS v6?

No. This package is built for AdonisJS v7 and ESM. For v6, you would need a different package or a custom integration.

## Configuration

### What is the difference between `serverKey` and `clientKey`?

| Key         | Used by         | Purpose                          |
| ----------- | --------------- | -------------------------------- |
| `serverKey` | Backend only    | Authenticate API requests        |
| `clientKey` | Frontend only   | Initialize Snap JS SDK           |

`serverKey` is required. `clientKey` is only needed if you use Snap on the frontend.

### How do I switch from sandbox to production?

Set `MIDTRANS_SANDBOX=false` in your `.env` file and restart your server. The package automatically uses Midtrans production endpoints.

### Do I need an `irisKey`?

Only if you use Iris disbursement. Without it, `midtrans.iris` will be `undefined`.

### What happens if I set `timeout` below 1000ms?

`defineConfig` will throw a `MidtransValidationError` because Midtrans recommends at least 1 second for their API calls.

## Snap

### How do I get the Snap token to my frontend?

Create an API endpoint that returns the token:

```typescript
// app/controllers/checkout_controller.ts
async store({ response }: HttpContext) {
  const result = await midtrans.snap.createTransaction({
    transaction_details: { order_id: 'ORDER-1', gross_amount: 50000 },
  })

  return response.json({ token: result.token })
}
```

Then fetch it from your frontend:

```javascript
const res = await fetch('/checkout', { method: 'POST' })
const { token } = await res.json()
snap.pay(token)
```

### Can I use Snap with a full-page redirect instead of a popup?

Yes. Redirect the user to `result.redirect_url` instead of calling `snap.pay()`:

```typescript
return response.redirect().toPath(result.redirect_url)
```

### My Snap popup shows "Authentication failed"

This usually means the `clientKey` on the frontend does not match the environment. Check that:

1. You are using the sandbox `clientKey` with `MIDTRANS_SANDBOX=true`
2. The Snap JS script URL matches the environment (`.sandbox.midtrans.com` for sandbox)
3. The token was generated with the same account as the `clientKey`

## Core API

### How do I get the payment code for convenience store payments?

The `ChargeResponse` includes the payment code:

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createCStoreCharge('ORDER-1', 30000, 'indomaret')
)

console.log(charge.payment_code) // e.g. "1234567890"
```

### How do I generate a QR code for QRIS?

The response contains `qr_string`. Use any QR library to encode it:

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createQrisCharge('ORDER-1', 25000)
)

// Use qrcode, qrious, or any library
const qrDataUrl = await QRCode.toDataURL(charge.qr_string)
```

### Why is my credit card charge failing with "Invalid token"?

Make sure you:

1. Generate the card token client-side using Midtrans JS (never send raw card numbers to your server)
2. Use the token within its expiry window
3. Pass the token in `createCreditCardCharge({ token_id: '...' })`

## Webhooks

### Why am I not receiving webhook notifications?

1. Check that your webhook URL is publicly accessible (not localhost)
2. Verify the URL in your Midtrans dashboard matches your route exactly
3. Ensure your route accepts `POST` requests
4. Make sure you return HTTP 200 — 4xx/5xx responses trigger retries but may cause delays

### Midtrans is sending the same notification multiple times

This is expected. Midtrans retries on timeouts or non-200 responses. Guard against double-processing by checking if the order was already handled:

```typescript
const order = await Order.findBy('orderId', notification.order_id)
if (order?.status === 'paid') {
  return response.ok('Already processed')
}
```

### How do I test webhooks locally?

Use a tunnel service like [ngrok](https://ngrok.com):

```bash
ngrok http 3333
```

Then set your webhook URL in the Midtrans dashboard to the ngrok HTTPS URL.

### What statuses should I treat as "paid"?

Only `settlement` and `capture`. Use `isTransactionSuccess()`:

```typescript
if (isTransactionSuccess(notification)) {
  await fulfillOrder(notification.order_id)
}
```

## Errors

### I get `MidtransAPIError: 401 Unauthorized`

Your `serverKey` is invalid or from a different environment (sandbox vs production). Double-check the key in your `.env` file.

### I get `MidtransHTTPError: Request timeout`

Midtrans APIs can be slow. Increase the timeout in your config:

```typescript
defineConfig({
  serverKey: env.get('MIDTRANS_SERVER_KEY'),
  timeout: 60000, // 60 seconds
})
```

### I get `MidtransValidationError: serverKey is required`

`serverKey` cannot be an empty string. If you are loading from env, make sure the variable is set before the app starts.

## Still stuck?

- [Open an issue](https://github.com/rikoriswandha/adonisjs-midtrans/issues) with the error message and reproduction steps
- Check the [Midtrans documentation](https://docs.midtrans.com/) for API-specific questions
