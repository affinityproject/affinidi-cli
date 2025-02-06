import { readFile } from 'fs/promises'
import {
  IssuanceConfigDto,
  UpdateIssuanceConfigInput,
  CredentialSupportedObject,
} from '@affinidi-tdk/credential-issuance-client'
import { input } from '@inquirer/prompts'
import { ux, Flags } from '@oclif/core'
import { CLIError } from '@oclif/core/errors'
import z from 'zod'
import { BaseCommand } from '../../common/base-command.js'
import { promptRequiredParameters } from '../../common/prompts.js'
import { INPUT_LIMIT, validateInputLength } from '../../common/validators.js'
import { issuanceService } from '../../services/affinidi/cis/service.js'

export class UpdateIssuanceConfig extends BaseCommand<typeof UpdateIssuanceConfig> {
  static summary = 'Updates credential issuance configuration in your active project'
  static examples = [
    '<%= config.bin %> <%= command.id %> -i <value> -f credentialSchemas.json',
    '<%= config.bin %> <%= command.id %> --id <value> --name <value> --wallet-id <value> --description <value> --credential-offer-duration <value> --file credentialSchemas.json --[no-]enable-webhook --webhook-url <value>',
  ]
  static flags = {
    id: Flags.string({
      char: 'i',
      summary: 'ID of the credential issuance configuration',
    }),
    name: Flags.string({
      char: 'n',
      summary: 'Name of the credential issuance configuration',
    }),
    description: Flags.string({
      char: 'd',
      summary: 'Description of the credential issuance configuration',
    }),
    'wallet-id': Flags.string({
      char: 'w',
      summary: 'ID of the wallet',
    }),
    'credential-offer-duration': Flags.integer({
      summary: 'Credential offer duration in seconds',
    }),
    file: Flags.string({
      char: 'f',
      summary:
        'Location of a json file containing the list of allowed schemas for creating a credential offer. One or more schemas can be added to the issuance. The credential type ID must be unique',
    }),
    'enable-webhook': Flags.boolean({
      summary: 'Enable/Disable VC claim notifications',
      allowNo: true,
      dependsOn: ['webhook-url'],
    }),
    'webhook-url': Flags.string({
      char: 'u',
      summary: 'URL to receive notifications after VC is claimed',
      dependsOn: ['enable-webhook'],
    }),
  }

  public async run(): Promise<IssuanceConfigDto> {
    const { flags } = await this.parse(UpdateIssuanceConfig)

    const promptFlags = await promptRequiredParameters(['id'], flags)

    const flagsSchema = z.object({
      id: z.string().max(INPUT_LIMIT).uuid(),
      'wallet-id': z.string().max(INPUT_LIMIT).optional(),
      name: z.string().max(INPUT_LIMIT).optional(),
      description: z.string().max(INPUT_LIMIT).optional(),
      'credential-offer-duration': z.number().optional(),
      file: z.string().optional(),
      'enable-webhook': z.boolean().optional(),
      'webhook-url': z.string().max(INPUT_LIMIT).url().optional(),
    })
    const validatedFlags = flagsSchema.parse(promptFlags)

    const enableWebhook = validatedFlags['enable-webhook']
    let webhookUrl = validatedFlags['webhook-url']
    const isWebhookUrlProvided = !!webhookUrl && webhookUrl.trim().length > 0

    if (enableWebhook && !isWebhookUrlProvided) {
      if (flags['no-input']) {
        throw new CLIError('Webhook URL must be provided.')
      }

      webhookUrl = validateInputLength(await input({ message: 'Enter webhook URL' }), INPUT_LIMIT)
    }

    let credentialSupported: CredentialSupportedObject[] = []

    if (validatedFlags.file) {
      try {
        const rawData = await readFile(validatedFlags.file, 'utf8')
        credentialSupported = JSON.parse(rawData)
      } catch (error) {
        throw new CLIError(`Provided file is not a valid JSON\n${(error as Error).message}`)
      }
    }

    const data: UpdateIssuanceConfigInput = {
      name: validatedFlags.name,
      description: validatedFlags.description,
      issuerWalletId: validatedFlags['wallet-id'],
      credentialOfferDuration: validatedFlags['credential-offer-duration'],
      credentialSupported: validatedFlags.file ? credentialSupported : undefined,
      webhook: {
        enabled: !!enableWebhook,
        ...(webhookUrl && {
          endpoint: {
            url: webhookUrl,
          },
        }),
      },
    }

    const credentialSupportedSchema = z.object({
      credentialTypeId: z.string(),
      jsonSchemaUrl: z.string(),
      jsonLdContextUrl: z.string(),
    })

    const schema = z.object({
      name: z.string().max(INPUT_LIMIT).optional(),
      issuerWalletId: z.string().max(INPUT_LIMIT).optional(),
      description: z.string().max(INPUT_LIMIT).optional().optional(),
      credentialOfferDuration: z.number().optional(),
      credentialSupported: z.array(credentialSupportedSchema).optional(),
      webhook: z.object({
        enabled: z.boolean(),
        endpoint: z
          .object({
            url: z.string().max(INPUT_LIMIT).optional(),
          })
          .optional(),
      }),
    })
    const configInput = schema.parse(data)

    ux.action.start('Updating credential issuance configuration')
    const output = await issuanceService.updateIssuanceConfigById(validatedFlags.id, configInput)
    ux.action.stop('Updated successfully!')

    if (!this.jsonEnabled()) this.logJson(output)
    return output
  }
}
