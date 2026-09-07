import { test } from '@japa/runner'
import { defineConfig } from '../src/define_config.js'
import { MidtransValidationError } from '../src/midtrans_error.js'

test.group('defineConfig', () => {
  test('returns config with default values when only serverKey is provided', ({ assert }) => {
    const config = defineConfig({ serverKey: 'sk_123' })

    assert.equal(config.serverKey, 'sk_123')
    assert.isFalse(config.sandbox)
    assert.equal(config.timeout, 30000)
    assert.isFalse(config.debug)
  })

  test('throws MidtransValidationError when serverKey is missing', ({ assert }) => {
    try {
      defineConfig({} as any)
      assert.fail('Expected MidtransValidationError to be thrown')
    } catch (error) {
      assert.instanceOf(error, MidtransValidationError)
      assert.equal((error as MidtransValidationError).field, 'serverKey')
      assert.equal((error as MidtransValidationError).message, 'is required')
    }
  })

  test('throws MidtransValidationError when timeout is less than 1000', ({ assert }) => {
    try {
      defineConfig({ serverKey: 'sk_123', timeout: 100 })
      assert.fail('Expected MidtransValidationError to be thrown')
    } catch (error) {
      assert.instanceOf(error, MidtransValidationError)
      assert.equal((error as MidtransValidationError).field, 'timeout')
      assert.equal((error as MidtransValidationError).message, 'must be at least 1000ms')
    }
  })

  test('applies custom values overriding defaults', ({ assert }) => {
    const config = defineConfig({
      serverKey: 'sk_custom',
      clientKey: 'ck_custom',
      irisKey: 'ir_custom',
      sandbox: true,
      timeout: 5000,
      debug: true,
    })

    assert.equal(config.serverKey, 'sk_custom')
    assert.equal(config.clientKey, 'ck_custom')
    assert.equal(config.irisKey, 'ir_custom')
    assert.isTrue(config.sandbox)
    assert.equal(config.timeout, 5000)
    assert.isTrue(config.debug)
  })

  test('timeout exactly 1000 is valid', ({ assert }) => {
    const config = defineConfig({ serverKey: 'sk_123', timeout: 1000 })
    assert.equal(config.timeout, 1000)
  })
})

test('rejects non-finite timeouts', ({ assert }) => {
  for (const timeout of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => defineConfig({ serverKey: 'sk_123', timeout }), MidtransValidationError)
  }
})
