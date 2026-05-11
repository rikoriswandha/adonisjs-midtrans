import { HttpClient } from './http_client.js'
import { SnapClient } from './snap_client.js'
import { CoreClient } from './core_client.js'
import { IrisClient } from './iris_client.js'
import type { MidtransConfig } from './types.js'

export class MidtransManager {
  readonly #httpClient: HttpClient
  readonly #snapClient: SnapClient
  readonly #coreClient: CoreClient
  readonly #irisClient?: IrisClient
  readonly #irisHttpClient?: HttpClient

  constructor(private readonly config: MidtransConfig) {
    this.#httpClient = new HttpClient(config)
    this.#snapClient = new SnapClient(this.#httpClient)
    this.#coreClient = new CoreClient(this.#httpClient)

    if (config.irisKey) {
      this.#irisHttpClient = new HttpClient({ ...config, serverKey: config.irisKey })
      this.#irisClient = new IrisClient(this.#irisHttpClient)
    }
  }

  get snap(): SnapClient {
    return this.#snapClient
  }

  get core(): CoreClient {
    return this.#coreClient
  }

  get iris(): IrisClient | undefined {
    return this.#irisClient
  }

  get safeConfig(): Omit<MidtransConfig, 'serverKey' | 'irisKey'> {
    const { serverKey, irisKey, ...safeConfig } = this.config
    return safeConfig
  }
}
