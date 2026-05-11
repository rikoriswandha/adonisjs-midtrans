import { test } from '@japa/runner'
import { MidtransManager } from '../src/midtrans_manager.js'
import { SnapClient } from '../src/snap_client.js'
import { CoreClient } from '../src/core_client.js'
import { IrisClient } from '../src/iris_client.js'
import type { MidtransConfig } from '../src/types.js'

test.group('MidtransManager', () => {
  const baseConfig: MidtransConfig = {
    serverKey: 'test-server-key',
    sandbox: true,
    timeout: 5000,
    debug: false,
  }

  test('creates SnapClient accessible via snap getter', ({ assert }) => {
    const manager = new MidtransManager(baseConfig)

    assert.instanceOf(manager.snap, SnapClient)
  })

  test('creates CoreClient accessible via core getter', ({ assert }) => {
    const manager = new MidtransManager(baseConfig)

    assert.instanceOf(manager.core, CoreClient)
  })

  test('iris returns IrisClient when irisKey is provided', ({ assert }) => {
    const manager = new MidtransManager({
      ...baseConfig,
      irisKey: 'test-iris-key',
    })

    assert.instanceOf(manager.iris, IrisClient)
  })

  test('iris returns undefined when irisKey is not provided', ({ assert }) => {
    const manager = new MidtransManager(baseConfig)

    assert.isUndefined(manager.iris)
  })

  test('safeConfig does not contain serverKey', ({ assert }) => {
    const manager = new MidtransManager(baseConfig)

    const safeConfig = manager.safeConfig

    assert.notProperty(safeConfig, 'serverKey')
  })

  test('safeConfig does not contain irisKey', ({ assert }) => {
    const manager = new MidtransManager({
      ...baseConfig,
      irisKey: 'test-iris-key',
    })

    const safeConfig = manager.safeConfig

    assert.notProperty(safeConfig, 'irisKey')
  })

  test('safeConfig retains non-sensitive config values', ({ assert }) => {
    const manager = new MidtransManager(baseConfig)

    const safeConfig = manager.safeConfig

    assert.equal(safeConfig.sandbox, true)
    assert.equal(safeConfig.timeout, 5000)
    assert.equal(safeConfig.debug, false)
  })

  test('all clients share the same underlying HttpClient', async ({ assert }) => {
    let requestCount = 0

    globalThis.fetch = async () => {
      requestCount++
      return new Response(JSON.stringify({}), { status: 200 })
    }

    const manager = new MidtransManager(baseConfig)

    await manager.core.charge({
      transaction_details: { order_id: 'order-1', gross_amount: 1000 },
      payment_type: 'gopay',
      gopay: { provider: 'gopay' },
    })

    assert.equal(requestCount, 1)
  })
})
