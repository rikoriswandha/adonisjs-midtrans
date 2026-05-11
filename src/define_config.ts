/**
 * Type-safe Midtrans configuration helper
 */

import type { MidtransConfig } from './types.js'
import { MidtransValidationError } from './midtrans_error.js'

/**
 * Define and validate Midtrans configuration with type safety.
 *
 * Applies sensible defaults and validates required fields.
 * Throws MidtransValidationError for invalid input.
 *
 * @example
 * ```ts
 * const config = defineConfig({
 *   serverKey: 'SB-Mid-server-xxx',
 *   sandbox: true,
 * })
 * ```
 */
export function defineConfig(
  config: Partial<MidtransConfig> & { serverKey: string }
): MidtransConfig {
  if (!config.serverKey) {
    throw new MidtransValidationError('serverKey', 'is required')
  }

  if (config.timeout !== undefined && config.timeout < 1000) {
    throw new MidtransValidationError('timeout', 'must be at least 1000ms')
  }

  if (config.sandbox !== undefined && typeof config.sandbox !== 'boolean') {
    throw new MidtransValidationError('sandbox', 'must be a boolean')
  }

  return {
    serverKey: config.serverKey,
    clientKey: config.clientKey,
    irisKey: config.irisKey,
    sandbox: config.sandbox ?? false,
    timeout: config.timeout ?? 30000,
    debug: config.debug ?? false,
  }
}
