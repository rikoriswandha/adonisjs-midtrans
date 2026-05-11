import { stubsRoot } from './stubs/main.js'
import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  await codemods.makeUsingStub(stubsRoot, 'config.stub', {})

  await codemods.updateRcFile((transformer) => {
    transformer.addProvider('@rikoriswandha/adonisjs-midtrans/midtrans_provider')
  })

  command.logger.info('Midtrans configured successfully!')
  command.logger.info('')
  command.logger.info('Add the following to your .env file:')
  command.logger.info('MIDTRANS_SERVER_KEY=your_server_key')
  command.logger.info('MIDTRANS_CLIENT_KEY=your_client_key')
  command.logger.info('MIDTRANS_IRIS_KEY=your_iris_key (optional)')
  command.logger.info('MIDTRANS_SANDBOX=true')
}
