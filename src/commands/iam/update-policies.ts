import { readFileSync } from 'fs'
import { confirm, input } from '@inquirer/prompts'
import { ux, Flags } from '@oclif/core'
import { CLIError } from '@oclif/core/lib/errors'
import chalk from 'chalk'
import { z } from 'zod'
import { BaseCommand, PrincipalTypes } from '../../common'
import { clientSDK } from '../../services/affinidi'
import { iamService } from '../../services/affinidi/iam'
import { PolicyDto } from '../../services/affinidi/iam/iam.api'

export class UpdatePolicies extends BaseCommand<typeof UpdatePolicies> {
  static summary = 'Updates the policies of a principal (user or token) in the active project'
  static description = `Make sure the principal you are working with is part of the active project\n\
    Use command ${chalk.inverse('affinidi project select-project')} to change your active project`
  static examples = [
    '<%= config.bin %> <%= command.id %> -i <uuid>',
    '<%= config.bin %> <%= command.id %> --id <uuid> --type machine_user',
  ]
  static flags = {
    'principal-id': Flags.string({
      char: 'i',
      summary: 'ID of the principal',
      description: `Get a list of possible IDs with command ${chalk.inverse('affinidi token list-tokens')}`,
      required: true,
    }),
    'principal-type': Flags.string({
      char: 't',
      summary: 'Type of the principal',
      options: Object.values(PrincipalTypes),
      default: PrincipalTypes.TOKEN,
    }),
    file: Flags.string({
      char: 'f',
      summary: 'Location of a json file containing principal policies',
    }),
  }

  public async run(): Promise<PolicyDto> {
    const { flags } = await this.parse(UpdatePolicies)
    const flagsSchema = z.object({
      'principal-id': z.string().uuid(),
      'principal-type': z.nativeEnum(PrincipalTypes),
      file: z.string().optional(),
    })
    const validatedFlags = flagsSchema.parse(flags)

    const policiesDataSchema = z.object({
      version: z.string(),
      statement: z
        .object({
          principal: z.string().array().length(1),
          action: z.string().array().nonempty(),
          resource: z.string().array().nonempty(),
          effect: z.literal('Allow'),
        })
        .array()
        .nonempty(),
    })
    let policiesData = null
    if (validatedFlags.file) {
      const rawData = readFileSync(validatedFlags.file, 'utf8')
      try {
        policiesData = JSON.parse(rawData)
      } catch (error) {
        throw new CLIError(`Provided file is not a valid JSON\n${(error as Error).message}`)
      }
    } else {
      this.log(
        `Assigning a single policy statement to a principal. To assign multiple statements please use the ${chalk.inverse(
          '--file',
        )} flag instead.`,
      )
      this.warn('\nThis will override the existing principal statements')
      const resourceFilters = await input({ message: 'Enter the resource filters, separated by space' })
      const actions = await input({ message: 'Enter the allowed actions, separated by space' })

      policiesData = {
        version: '2022-12-15',
        statement: [
          {
            principal: [
              `ari:iam::${clientSDK.config.getProjectToken()?.projectId}:${validatedFlags['principal-type']}/${
                validatedFlags['principal-id']
              }`,
            ],
            action: actions.split(' '),
            resource: resourceFilters.split(' '),
            effect: 'Allow',
          },
        ],
      }
    }
    const validatedPolicies = policiesDataSchema.parse(policiesData)

    this.log(`The following policies will be updated for principal ${chalk.inverse(validatedFlags['principal-id'])}:`)
    this.logJson(validatedPolicies)
    const confirmPolicies = await confirm({
      message: 'Update policies?',
    })

    if (!confirmPolicies) {
      throw new CLIError('Action canceled')
    }
    ux.action.start('Updating principal policies')
    const out = await iamService.updatePolicies(
      clientSDK.config.getProjectToken()?.projectAccessToken,
      validatedFlags['principal-id'],
      validatedFlags['principal-type'],
      validatedPolicies,
    )
    ux.action.stop('Updated successfully!')

    if (!this.jsonEnabled()) this.logJson(out)
    return out
  }
}
