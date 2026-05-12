import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type Configure from '@adonisjs/core/commands/configure'

const stubsRoot = join(dirname(fileURLToPath(import.meta.url)), 'stubs')

export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  const serverKey = await command.prompt.secure('Enter your Midtrans server key', {
    validate: (value: string) => (value ? true : 'Midtrans server key is required'),
  })

  const clientKey = await command.prompt.ask('Enter your Midtrans client key (optional)')

  const irisKey = await command.prompt.secure('Enter your Midtrans Iris key (optional)')

  const configPath = command.app.configPath('midtrans.ts')
  const configExists = await access(configPath, constants.F_OK)
    .then(() => true)
    .catch(() => false)

  if (configExists) {
    const overwrite = await command.prompt.confirm(
      'A config/midtrans.ts file already exists. Do you want to overwrite it?'
    )

    if (!overwrite) {
      command.logger.info('Skipped publishing config/midtrans.ts')
    } else {
      await codemods.makeUsingStub(stubsRoot, 'config/midtrans.stub', {})
      command.logger.success('Updated config/midtrans.ts')
    }
  } else {
    await codemods.makeUsingStub(stubsRoot, 'config/midtrans.stub', {})
    command.logger.success('Created config/midtrans.ts')
  }

  await codemods.defineEnvVariables(
    {
      MIDTRANS_SERVER_KEY: serverKey,
      MIDTRANS_CLIENT_KEY: clientKey || '',
      MIDTRANS_IRIS_KEY: irisKey || '',
      MIDTRANS_SANDBOX: 'true',
      MIDTRANS_TIMEOUT: '30000',
      MIDTRANS_DEBUG: 'false',
    },
    {
      omitFromExample: ['MIDTRANS_SERVER_KEY', 'MIDTRANS_IRIS_KEY'],
    }
  )

  await codemods.defineEnvValidations({
    variables: {
      MIDTRANS_SERVER_KEY: 'Env.schema.string()',
      MIDTRANS_CLIENT_KEY: 'Env.schema.string.optional()',
      MIDTRANS_IRIS_KEY: 'Env.schema.string.optional()',
      MIDTRANS_SANDBOX: "Env.schema.boolean()",
      MIDTRANS_TIMEOUT: 'Env.schema.number.optional()',
      MIDTRANS_DEBUG: 'Env.schema.boolean.optional()',
    },
  })

  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@rikoriswandha/adonisjs-midtrans/midtrans_provider')
  })

  command.logger.success('@rikoriswandha/adonisjs-midtrans configured successfully')
}
