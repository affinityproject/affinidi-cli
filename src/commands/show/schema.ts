import { CliUx, Command, Flags, Interfaces } from '@oclif/core'
import { StatusCodes } from 'http-status-codes'
import { anonymous, ViewFormat } from '../../constants'

import { getErrorOutput, CliError, Unauthorized } from '../../errors'
import { vaultService } from '../../services/vault/typedVaultService'
import { schemaManagerService } from '../../services/schema-manager'
import { getSession } from '../../services/user-management'
import { analyticsService, generateUserMetadata } from '../../services/analytics'
import { EventDTO } from '../../services/analytics/analytics.api'
import { isAuthenticated } from '../../middleware/authentication'
import { DisplayOptions, displayOutput } from '../../middleware/display'
import { configService } from '../../services/config'

export type ShowFieldType = 'info' | 'json' | 'jsonld'

export default class Schema extends Command {
  static command = 'affinidi show schema'

  static usage = 'show schema [schema-id]'

  static description = `Fetches the information of a specific schema.`

  static examples: Interfaces.Example[] = [
    {
      description: 'Shows the url to complete details of the given schema',
      command: '<%= config.bin %> <%= command.id %> [SCHEMA-ID]',
    },
    {
      description: 'Shows the url to the json file of the given schema',
      command: '<%= config.bin %> <%= command.id %> [SCHEMA-ID] --show json',
    },
    {
      description: 'Shows the url to the json-ld-context of the given schema',
      command: '<%= config.bin %> <%= command.id %> [SCHEMA-ID] --show jsonld',
    },
  ]

  static flags = {
    show: Flags.enum<ShowFieldType>({
      char: 's',
      options: ['info', 'json', 'jsonld'],
      description: 'The details of the schema to show',
      default: 'info',
    }),
    output: Flags.enum<ViewFormat>({
      char: 'o',
      description: 'set flag to override default output format view',
      options: ['plaintext', 'json'],
    }),
  }

  static args: Interfaces.Arg[] = [
    {
      name: 'schema-id',
      required: true,
      description: 'id or name of the schema to display',
    },
  ]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Schema)
    const schemaId = args['schema-id']
    if (!isAuthenticated() && schemaId.includes('@did:elem')) {
      throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'schema')
    }
    const { account } = getSession()

    CliUx.ux.action.start('Fetching schema')
    let apiKey: string
    if (args['schema-id'].includes('@did:elem')) {
      const activeProject = vaultService.getActiveProject()
      apiKey = activeProject.apiKey.apiKeyHash
    }
    const schema = await schemaManagerService.getById(schemaId, apiKey)
    const analyticsData: EventDTO = {
      name: 'VC_SCHEMAS_READ',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: account.userId || anonymous,
      metadata: {
        schemaId: schema?.id,
        commandId: 'affinidi.showSchema',
        ...generateUserMetadata(account.label),
      },
    }
    await analyticsService.eventsControllerSend(analyticsData)
    let output = ''
    switch (flags.show) {
      case 'json':
        output = schema.jsonSchemaUrl
        break
      case 'jsonld':
        output = schema.jsonLdContextUrl
        break
      default:
        output = JSON.stringify(schema, null, '  ')
    }

    CliUx.ux.action.stop('')
    displayOutput({ itemToDisplay: output, flag: flags.output })
  }

  protected async catch(error: CliError): Promise<void> {
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()
    const optionsDisplay: DisplayOptions = {
      itemToDisplay: getErrorOutput(
        error,
        Schema.command,
        Schema.usage,
        Schema.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    }
    try {
      const { flags } = await this.parse(Schema)
      optionsDisplay.flag = flags.output
      displayOutput(optionsDisplay)
    } catch (_) {
      displayOutput(optionsDisplay)
    }
  }
}
