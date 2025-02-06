import { readFile } from 'fs/promises'
import {
  IssuanceConfigDto,
  CreateIssuanceConfigInput,
  CredentialSupportedObject,
} from '@affinidi-tdk/credential-issuance-client'
import { WalletDto, CreateWalletInput } from '@affinidi-tdk/wallets-client'
import { input, select } from '@inquirer/prompts'
import { ux, Flags } from '@oclif/core'
import { CLIError } from '@oclif/core/errors'
import z from 'zod'
import { BaseCommand } from '../../common/base-command.js'
import { DidMethods } from '../../common/constants.js'
import { promptRequiredParameters } from '../../common/prompts.js'
import { INPUT_LIMIT, validateInputLength } from '../../common/validators.js'
import { issuanceService } from '../../services/affinidi/cis/service.js'
import { cweService } from '../../services/affinidi/cwe/service.js'

export class CreateIssuanceConfig extends BaseCommand<typeof CreateIssuanceConfig> {
  static summary = 'Creates credential issuance configuration in your active project'
  static examples = [
    '<%= config.bin %> <%= command.id %> -n <value> -w <value> -f credentialSchemas.json',
    '<%= config.bin %> <%= command.id %> --name <value> --wallet-id <value> --description <value> --credential-offer-duration <value> --file credentialSchemas.json --[no-]enable-webhook --webhook-url <value>',
  ]
  static flags = {
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
      default: false,
    }),
    'webhook-url': Flags.string({
      char: 'u',
      summary: 'URL to receive notifications after VC is claimed',
    }),
  }

  public async run(): Promise<IssuanceConfigDto> {
    const { flags } = await this.parse(CreateIssuanceConfig)

    const promptFlags = await promptRequiredParameters(['wallet-id', 'name', 'file'], flags)

    const flagsSchema = z.object({
      'wallet-id': z.string().max(INPUT_LIMIT),
      name: z.string().min(3).max(INPUT_LIMIT),
      description: z.string().max(INPUT_LIMIT).optional(),
      'credential-offer-duration': z.number().optional(),
      file: z.string(),
      'enable-webhook': z.boolean().optional(),
      'webhook-url': z.string().max(INPUT_LIMIT).url().optional(),
    })
    const validatedFlags = flagsSchema.parse(promptFlags)

    ux.action.start('Fetching wallets')
    const { wallets } = await cweService.listWallets()
    ux.action.stop('Fetched successfully!')

    let issuerWalletId = validatedFlags['wallet-id']

    const walletIds = wallets?.map((wallet: WalletDto) => wallet.id) || []
    const wrongAriProvided = !walletIds.includes(issuerWalletId)

    if (!issuerWalletId || wallets?.length === 0 || wrongAriProvided) {
      const walletChoices =
        wallets?.map((wallet: WalletDto) => ({
          name: wallet.name || wallet.id,
          value: wallet.id,
        })) || []

      const CREATE_NEW_WALLET = 'Create new wallet'
      walletChoices.push({ name: CREATE_NEW_WALLET, value: CREATE_NEW_WALLET })

      const selectedWallet = await select({
        message: 'Select the wallet used for signing credentials that will be issued',
        choices: walletChoices,
      })

      if (selectedWallet === CREATE_NEW_WALLET) {
        const walletDidMethodChoices = Object.values(DidMethods).map((method: string) => ({
          name: method,
          value: method,
          default: DidMethods.KEY,
        }))

        const name = validateInputLength(await input({ message: 'Enter wallet name' }), INPUT_LIMIT)
        const description = validateInputLength(
          await input({ message: 'Enter wallet description (optional)' }),
          INPUT_LIMIT,
        )
        const didMethod = await select({ message: 'Select DID method of wallet', choices: walletDidMethodChoices })

        const isDidWeb = didMethod === DidMethods.WEB
        const didWebUrl = isDidWeb
          ? validateInputLength(await input({ message: 'Enter did:web URL (your applications domain)' }), INPUT_LIMIT)
          : undefined

        const newWalletData = {
          name,
          description,
          didMethod,
          ...(isDidWeb && { didWebUrl }),
        }

        const walletSchema = z
          .object({
            name: z.string().min(3).max(INPUT_LIMIT).optional(),
            description: z.string().max(INPUT_LIMIT).optional(),
            didMethod: z.nativeEnum(DidMethods).optional(),
            didWebUrl: z.string().min(3).max(INPUT_LIMIT).optional(),
          })
          .refine((wallet) => {
            if (wallet.didMethod === DidMethods.WEB && !wallet.didWebUrl) {
              return false
            }
            return true
          })

        const createWalletInput = walletSchema.parse(newWalletData)

        ux.action.start('Creating wallet')
        const output = await cweService.createWallet(createWalletInput as CreateWalletInput)
        ux.action.stop('Created successfully!')

        issuerWalletId = output.wallet?.id || ''
      } else {
        issuerWalletId = selectedWallet || ''
      }
    }

    let credentialSupported: CredentialSupportedObject[]

    try {
      const rawData = await readFile(validatedFlags.file, 'utf8')
      credentialSupported = JSON.parse(rawData)
    } catch (error) {
      throw new CLIError(`Provided file is not a valid JSON\n${(error as Error).message}`)
    }

    const webhookUrl = validatedFlags['webhook-url']
    const isWebhookUrlProvided = !!webhookUrl && webhookUrl.trim().length > 0

    const data: CreateIssuanceConfigInput = {
      name:
        flags.name ??
        validateInputLength(await input({ message: 'Enter credential issuance configuration name' }), INPUT_LIMIT),
      description: flags.description ?? '',
      issuerWalletId,
      credentialOfferDuration: flags['credential-offer-duration'] ?? undefined,
      credentialSupported: credentialSupported ?? [],
      ...((!!validatedFlags['enable-webhook'] || isWebhookUrlProvided) && {
        webhook: {
          enabled: !!validatedFlags['enable-webhook'],
          ...(isWebhookUrlProvided && {
            endpoint: {
              url: webhookUrl.trim(),
            },
          }),
        },
      }),
    }

    const credentialSupportedSchema = z.object({
      credentialTypeId: z.string(),
      jsonSchemaUrl: z.string(),
      jsonLdContextUrl: z.string(),
    })

    const schema = z.object({
      name: z.string().min(3).max(INPUT_LIMIT),
      issuerWalletId: z.string().min(1).max(INPUT_LIMIT),
      description: z.string().max(INPUT_LIMIT).optional(),
      credentialOfferDuration: z.number().min(1).optional(),
      credentialSupported: z.array(credentialSupportedSchema),
      webhook: z
        .object({
          enabled: z.boolean(),
          endpoint: z.object({
            url: z.string().max(INPUT_LIMIT).optional(),
          }),
        })
        .optional(),
    })
    const configInput = schema.parse(data)

    ux.action.start('Creating credential issuance configuration')
    const output = await issuanceService.createIssuanceConfig(configInput)
    ux.action.stop('Created successfully!')

    if (!this.jsonEnabled()) this.logJson(output)
    return output
  }
}
