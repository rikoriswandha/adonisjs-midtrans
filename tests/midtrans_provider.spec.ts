import { test } from '@japa/runner'
import { MidtransManager } from '../src/midtrans_manager.js'
import type { MidtransConfig } from '../src/types.js'

test.group('MidtransProvider', () => {
  test('register MidtransManager as singleton in container', async ({ assert }) => {
    const config: MidtransConfig = {
      serverKey: 'SB-Mid-server-test',
      sandbox: true,
      timeout: 30000,
      debug: false,
    }

    let capturedKey: unknown
    let capturedFactory: (() => Promise<unknown>) | undefined

    const mockApp = {
      config: {
        get<T>(key: string, _defaultValue: T): T {
          assert.equal(key, 'midtrans')
          return config as unknown as T
        },
      },
      container: {
        singleton(key: unknown, factory: () => Promise<unknown>) {
          capturedKey = key
          capturedFactory = factory
        },
      },
    }

    const { default: MidtransProvider } = await import('../providers/midtrans_provider.js')
    const provider = new MidtransProvider(mockApp as any)

    provider.register()

    assert.equal(capturedKey, MidtransManager)
    assert.isNotNull(capturedFactory)
  })

  test('factory creates MidtransManager with config from app.config', async ({ assert }) => {
    const config: MidtransConfig = {
      serverKey: 'SB-Mid-server-abc',
      sandbox: false,
      timeout: 60000,
      debug: true,
    }

    let factory: (() => Promise<unknown>) | undefined
    let capturedKey: string | undefined

    const mockApp = {
      config: {
        get<T>(key: string, _defaultValue: T): T {
          capturedKey = key
          return config as unknown as T
        },
      },
      container: {
        singleton(_key: unknown, fn: () => Promise<unknown>) {
          factory = fn
        },
      },
    }

    const { default: MidtransProvider } = await import('../providers/midtrans_provider.js')
    const provider = new MidtransProvider(mockApp as any)
    provider.register()

    assert.isDefined(factory)

    const midtransManager = await factory!()
    assert.equal(capturedKey, 'midtrans')
    assert.instanceOf(midtransManager, MidtransManager)
  })
})
