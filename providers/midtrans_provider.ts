import type { ApplicationService } from '@adonisjs/core/types'
import { defineConfig } from '../src/define_config.js'
import { MidtransManager } from '../src/midtrans_manager.js'
import type { MidtransConfig } from '../src/types.js'

export default class MidtransProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(MidtransManager, async () => {
      const config = this.app.config.get<Partial<MidtransConfig> & { serverKey: string }>(
        'midtrans',
        { serverKey: '' }
      )

      return new MidtransManager(defineConfig(config))
    })
  }
}
