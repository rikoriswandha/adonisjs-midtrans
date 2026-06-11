# Core API deep dive

The Core API lets you charge specific payment methods directly. Each helper returns a `ChargeRequest` that you pass to `midtrans.core.charge()`.

## Credit card

Requires a card token from Midtrans JS (client-side). Never send raw card numbers to your server.

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createCreditCardCharge('ORDER-200', 100000, {
    token_id: '481111-1114-e9f202f9-ec82-460f-97de-d4768d7f89f3',
    secure: true,
    bank: 'bni',
    channel: 'migs',
  })
)
```

| Option    | Type     | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `token_id`| required | Card token from Midtrans JS                           |
| `secure`  | optional | Enable 3D Secure                                      |
| `bank`    | optional | Acquiring bank (e.g. `bni`, `mandiri`, `cimb`)        |
| `channel` | optional | Channel partner (e.g. `migs`)                         |

## Bank transfer (virtual account)

### BCA

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createBankTransferCharge('ORDER-201', 75000, 'bca')
)
```

### Custom VA number

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createBankTransferCharge('ORDER-202', 75000, 'bca', '111222333444')
)
```

### Supported banks

- `bca`
- `bni`
- `bri`
- `mandiri`
- `permata`
- `cimb`

> Custom VA numbers are supported for BCA, BNI, BRI, and Mandiri.

## GoPay

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createGoPayCharge('ORDER-203', 50000, 'https://myapp.com/gopay-callback')
)
```

The callback URL is called by the GoPay app after the customer confirms payment.

## ShopeePay

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createShopeepayCharge('ORDER-204', 60000, 'https://myapp.com/shopeepay-callback')
)
```

## QRIS

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createQrisCharge('ORDER-205', 25000)
)
```

The response contains a `qr_string` that you can encode into a QR image for the customer to scan.

## Convenience store

### Indomaret

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createCStoreCharge('ORDER-206', 30000, 'indomaret', 'Payment for order 206')
)
```

### Alfamart

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createCStoreCharge('ORDER-207', 30000, 'alfamart', 'Payment for order 207')
)
```

The response includes a `payment_code` that the customer presents at the store counter.

## BNPL

### Akulaku

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createAkulakuCharge('ORDER-208', 200000)
)
```

### Kredivo

```typescript
const charge = await midtrans.core.charge(
  midtrans.core.createKredivoCharge('ORDER-209', 150000)
)
```

## Transaction management

### Check status

```typescript
const status = await midtrans.core.status('ORDER-123')
```

Returns the full transaction status including `transaction_status`, `payment_type`, `gross_amount`, and fraud-related fields.

### Cancel

```typescript
await midtrans.core.cancel('ORDER-123')
```

Only works for transactions that are still pending.

### Refund

Full refund:

```typescript
await midtrans.core.refund('ORDER-123')
```

Partial refund:

```typescript
await midtrans.core.refund('ORDER-123', {
  amount: 50000,
  reason: 'Customer requested partial refund',
})
```

### Expire

Force a pending transaction to expire:

```typescript
await midtrans.core.expire('ORDER-123')
```

### Approve

Approve a transaction that was flagged by fraud detection:

```typescript
await midtrans.core.approve('ORDER-123')
```

## See also

- [Midtrans Core API documentation](https://docs.midtrans.com/reference/core-api-introduction)
