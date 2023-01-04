import { CliUx, Command, Flags, Interfaces } from '@oclif/core'
import { stringify as csvStringify } from 'csv-stringify'
import { StatusCodes } from 'http-status-codes'

import { getSession } from '../../services/user-management'
import { getErrorOutput, CliError, Unauthorized } from '../../errors'
import { vaultService } from '../../services/vault/typedVaultService'
import { schemaManagerService, ScopeType } from '../../services/schema-manager'
import { EventDTO } from '../../services/analytics/analytics.api'
import { analyticsService, generateUserMetadata } from '../../services/analytics'
import { isAuthenticated } from '../../middleware/authentication'
import { anonymous } from '../../constants'
import { configService } from '../../services/config'
import { DisplayOptions, displayOutput } from '../../middleware/display'
import { selectSchema } from '../../user-actions/inquirer'
import ShowSchema from '../show/schema'

type OutputType = 'csv' | 'table' | 'json'

const printData = (
  data: Record<string, unknown>[],
  { extended, output }: { extended: boolean; output: OutputType },
): void => {
  let outputFormat = configService.getOutputFormat()
  outputFormat = outputFormat === undefined ? 'plaintext' : outputFormat
  let confOutput = output
  if (!output && outputFormat === 'plaintext') {
    confOutput = 'table'
  } else if (!output) {
    confOutput = 'json'
  }
  switch (confOutput) {
    case 'json':
      CliUx.ux.info(JSON.stringify(data, null, ' '))
      break
    case 'csv':
      csvStringify(data, { header: true }).pipe(process.stdout)
      break
    case 'table':
      CliUx.ux.table(
        data,
        {
          index: { header: '' },
          id: { header: 'ID' },
          description: { header: 'DESC' },
          createdAt: { header: 'Created', extended: true },
          parentId: { header: 'parent Id', extended: true },
          authorDid: { header: 'author Did', extended: true },
          version: {},
          revision: { extended: true },
          type: {},
          jsonSchemaUrl: { header: 'Schema Url', extended: true },
        },
        {
          extended,
        },
      )
      break
    default:
      throw new CliError('Unknown output format', 0, 'schema')
  }
}

export default class Schemas extends Command {
  static command = 'affinidi list schemas'

  static usage = 'show schemas [FLAGS]'

  static description = `Fetches and displays the schemas from the schema-manager.`

  static examples: Interfaces.Example[] = [
    {
      description: 'Display in an extended table the schemas from the 5th to the 15th',
      command: '<%= config.bin %> <%= command.id %> --output table --extended --skip 5 --limit 10',
    },
  ]

  static flags = {
    ...CliUx.ux.table.flags(),
    limit: Flags.integer({
      char: 'l',
      description: 'The number of schemas to display',
      default: 10,
    }),
    output: Flags.enum<OutputType>({
      char: 'o',
      options: ['csv', 'json', 'table'],
      description: 'The type of output',
    }),
    scope: Flags.enum<ScopeType>({
      char: 'c',
      options: ['default', 'public', 'unlisted'],
      description: 'The type of scope',
      default: 'default',
    }),
    // search: Flags.string({ char: 'q', description: 'The name of the schema to search for' }),
    skip: Flags.integer({ char: 's', description: 'The number of schemas to skip', default: 0 }),
    wizard: Flags.boolean({
      char: 'w',
      description: 'if it is called from wizard',
      default: false,
      hidden: true,
    }),
  }

  static args = [{ name: 'file' }]

  public async run(): Promise<void> {
    const { flags } = await this.parse(Schemas)

    const { extended, limit, output, scope, skip } = flags
    if (!isAuthenticated() && (scope === 'unlisted' || scope === 'default')) {
      throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'schema')
    }
    const session = getSession()
    let account
    if (session) {
      ;({ account } = session)
    }
    const analyticsData: EventDTO = {
      name: 'VC_SCHEMAS_SEARCHED',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: account?.userId || anonymous,
      metadata: {
        commandId: 'affinidi.listSchemas',
        ...generateUserMetadata(account?.label),
      },
    }
    let apiKey: string
    let did: string
    if (scope === 'unlisted' || scope === 'default') {
      const activeProject = vaultService.getActiveProject()
      apiKey = activeProject.apiKey.apiKeyHash
      did = activeProject.wallet.did
    }
    const params = {
      apiKey,
      authorDid: did,
      did,
      limit,
      scope,
      skip,
    }

    const schemas = await schemaManagerService.search(params)
    await analyticsService.eventsControllerSend(analyticsData)

    const data = schemas.map((s, index) => {
      return {
        index,
        id: s.id,
        parentId: s.parentId,
        authorDid: s.authorDid,
        description: s.description,
        createdAt: s.createdAt,
        type: s.type,
        version: s.version,
        revision: s.revision,
        jsonSchemaUrl: s.jsonSchemaUrl,
      }
    })
    if (flags.wizard) {
      const maxIdLength = schemas.map((p) => p.id.length).reduce((p, c) => Math.max(p, c), 0)
      const schemaId = await selectSchema(schemas, maxIdLength)
      await ShowSchema.run([`${schemaId}`, '-o', 'plaintext'])
      return
    }

    printData(data, { extended, output })
  }

  protected async catch(error: CliError): Promise<void> {
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()
    const optionsDisplay: DisplayOptions = {
      itemToDisplay: getErrorOutput(
        error,
        Schemas.command,
        Schemas.usage,
        Schemas.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    }
    try {
      const { flags } = await this.parse(Schemas)
      if (flags.output === 'table') {
        optionsDisplay.flag = 'plaintext'
      } else if (flags.output === 'json') {
        optionsDisplay.flag = 'json'
      }
      displayOutput(optionsDisplay)
    } catch (_) {
      displayOutput(optionsDisplay)
    }
  }
}
