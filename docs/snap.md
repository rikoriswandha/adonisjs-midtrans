# Snap integration guide

Snap is Midtrans's hosted checkout page. Your server creates a transaction token, and the frontend uses that token to display the Midtrans payment UI.

## Creating a transaction

Use `midtrans.snap.createTransaction` with the customer's order details:

```typescript
import { MidtransManager } from '@rikoriswandha/adonisjs-midtrans'

export default class CheckoutController {
  constructor(private midtrans: MidtransManager) {}

  async store({ request, response }: HttpContext) {
    const { items, customer } = request.only(['items', 'customer'])

    const result = await this.midtrans.snap.createTransaction({
      transaction_details: {
        order_id: `ORDER-${Date.now()}`,
        gross_amount: items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0),
      },
      item_details: items.map((item: any) => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      customer_details: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        phone: customer.phone,
      },
    })

    return response.json({
      token: result.token,
      redirectUrl: result.redirect_url,
    })
  }
}
```

## Frontend integration with Edge

In your Edge template, load the Midtrans Snap JS SDK and pass the token:

```edge
<!DOCTYPE html>
<html>
<head>
  <script src="https://app.sandbox.midtrans.com/snap/snap.js"
    data-client-key="{{ clientKey }}"></script>
</head>
<body>
  <button id="pay-button">Pay Now</button>

  <script>
    const payButton = document.getElementById('pay-button')
    payButton.addEventListener('click', () => {
      snap.pay('{{ snapToken }}', {
        onSuccess: (result) => { console.log('success', result) },
        onPending: (result) => { console.log('pending', result) },
        onError: (result) => { console.log('error', result) },
        onClose: () => { console.log('closed') },
      })
    })
  </script>
</body>
</html>
```

> Use `https://app.midtrans.com/snap/snap.js` in production (remove the `.sandbox` subdomain).

## Restricting payment methods

Use `enabled_payments` to control which options appear:

```typescript
await midtrans.snap.createTransaction({
  transaction_details: { order_id: 'ORDER-1', gross_amount: 100000 },
  enabled_payments: ['credit_card', 'gopay', 'bca_va', 'indomaret'],
})
```

Common values include: `credit_card`, `gopay`, `shopeepay`, `bca_va`, `bni_va`, `bri_va`, `mandiri_va`, `permata_va`, `cimb_va`, `indomaret`, `alfamart`, `akulaku`, `kredivo`, `qris`.

## Redirect flow (server-side)

If you prefer a full-page redirect instead of a popup, send the customer to `result.redirect_url` directly:

```typescript
return response.redirect().toPath(result.redirect_url)
```

## Custom expiry

Set a custom expiration time for the transaction:

```typescript
await midtrans.snap.createTransaction({
  transaction_details: { order_id: 'ORDER-1', gross_amount: 50000 },
  expiry: {
    unit: 'hour',
    duration: 2,
  },
})
```

## Multiple shipping addresses

For marketplaces or multi-vendor scenarios:

```typescript
await midtrans.snap.createTransaction({
  transaction_details: { order_id: 'ORDER-1', gross_amount: 150000 },
  item_details: [
    { id: 'a', price: 50000, quantity: 1, name: 'Item A' },
    { id: 'b', price: 100000, quantity: 1, name: 'Item B' },
  ],
  customer_details: {
    first_name: 'John',
    email: 'john@example.com',
  },
  shipping_address: {
    first_name: 'John',
    address: 'Jl. Sudirman No. 1',
    city: 'Jakarta',
    postal_code: '12190',
    phone: '081234567890',
    country_code: 'IDN',
  },
})
```

## See also

- [Midtrans Snap documentation](https://docs.midtrans.com/reference/snap-introduction)
- [Snap JS SDK reference](https://docs.midtrans.com/reference/snap-js)
