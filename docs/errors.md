# Error handling reference

All errors in this package extend `MidtransError`. This lets you catch every Midtrans-related failure with a single `instanceof` check, or handle specific cases with the subclasses.

## Error hierarchy

```
Error
└── MidtransError
    ├── MidtransHTTPError
    ├── MidtransAPIError
    ├── MidtransValidationError
    └── MidtransSignatureError
```

## MidtransError

Base class. Rarely thrown directly, but useful as a catch-all:

```typescript
import { MidtransError } from '@rikology/adonisjs-midtrans'

try {
  await midtrans.core.charge(params)
} catch (error) {
  if (error instanceof MidtransError) {
    // Any Midtrans-related error
    console.log(error.name)
    console.log(error.statusCode)
    console.log(error.apiResponse)
  } else {
    // Non-Midtrans error (e.g. your own code)
    throw error
  }
}
```

### Properties

| Property      | Type     | Description                    |
| ------------- | -------- | ------------------------------ |
| `name`        | string   | Error class name               |
| `message`     | string   | Human-readable message         |
| `statusCode`  | number?  | HTTP status code if applicable |
| `apiResponse` | string?  | Raw API response body          |

## MidtransHTTPError

Thrown when the HTTP request itself fails: network errors, DNS issues, timeouts, or 5xx responses from Midtrans.

```typescript
import { MidtransHTTPError } from '@rikology/adonisjs-midtrans'

try {
  await midtrans.core.charge(params)
} catch (error) {
  if (error instanceof MidtransHTTPError) {
    console.log(error.statusCode)      // e.g. 500, 503, or 0 for network failure
    console.log(error.requestUrl)      // Full URL that was requested
    console.log(error.requestMethod)   // "POST", "GET", etc.
    console.log(error.message)         // Description of the failure
  }
}
```

### Properties

| Property        | Type   | Description              |
| --------------- | ------ | ------------------------ |
| `statusCode`    | number | HTTP status code         |
| `requestUrl`    | string | URL that was requested   |
| `requestMethod` | string | HTTP method              |

## MidtransAPIError

Thrown when Midtrans returns a 4xx response with validation errors. This means the request reached Midtrans but was rejected.

```typescript
import { MidtransAPIError } from '@rikology/adonisjs-midtrans'

try {
  await midtrans.core.charge(params)
} catch (error) {
  if (error instanceof MidtransAPIError) {
    console.log(error.statusCode)      // e.g. 400, 401, 404
    console.log(error.statusMessage)   // Midtrans error message
    console.log(error.errorMessages)   // Array of detailed validation messages
  }
}
```

### Properties

| Property        | Type     | Description                        |
| --------------- | -------- | ---------------------------------- |
| `statusCode`    | number   | HTTP status code                   |
| `statusMessage` | string   | Midtrans summary error message     |
| `errorMessages` | string[] | Detailed field-level error strings |

## MidtransValidationError

Thrown by `defineConfig` when your configuration is invalid (e.g. missing `serverKey`, timeout below 1000ms).

```typescript
import { defineConfig } from '@rikology/adonisjs-midtrans/define_config'
import { MidtransValidationError } from '@rikology/adonisjs-midtrans'

try {
  defineConfig({ serverKey: '', sandbox: true })
} catch (error) {
  if (error instanceof MidtransValidationError) {
    console.log(error.field)    // "serverKey"
    console.log(error.message)  // "serverKey is required"
  }
}
```

### Properties

| Property | Type   | Description           |
| -------- | ------ | --------------------- |
| `field`  | string | The invalid config key |

## MidtransSignatureError

Thrown when webhook signature verification fails. Note: `validateSignature` returns `false` rather than throwing. This error class is available for cases where you want to throw explicitly after validation.

```typescript
import { MidtransSignatureError } from '@rikology/adonisjs-midtrans'

function assertSignature(valid: boolean) {
  if (!valid) {
    throw new MidtransSignatureError('Webhook signature verification failed')
  }
}
```

## Serialization

Every error class has a `toJSON()` method that returns a plain object. Sensitive fields like `serverKey` are never included.

```typescript
try {
  await midtrans.core.charge(params)
} catch (error) {
  if (error instanceof MidtransError) {
    logger.error('Payment failed', error.toJSON())
    // Safe to log, store, or return in API responses
  }
}
```

## Common patterns

### Graceful degradation

```typescript
async function chargeWithFallback(params: ChargeRequest) {
  try {
    return await midtrans.core.charge(params)
  } catch (error) {
    if (error instanceof MidtransAPIError) {
      await notifyOps('Payment rejected by Midtrans', error.toJSON())
      return null
    }
    if (error instanceof MidtransHTTPError) {
      await notifyOps('Midtrans unavailable', error.toJSON())
      return null
    }
    throw error // Unexpected error, bubble up
  }
}
```

### Structured logging

```typescript
import { MidtransError } from '@rikology/adonisjs-midtrans'

function logMidtransError(error: unknown, context: string) {
  if (error instanceof MidtransError) {
    logger.error({ err: error.toJSON(), context }, 'Midtrans error')
  } else {
    logger.error({ err: error, context }, 'Unexpected error')
  }
}
```
