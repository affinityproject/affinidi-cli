import { Command, CliUx, Flags } from '@oclif/core'
import { StatusCodes } from 'http-status-codes'

import { getErrorOutput, CliError } from '../../errors'
import { DisplayOptions, displayOutput } from '../../middleware/display'
import { configService } from '../../services/config'
import { ViewFormat } from '../../constants'
import { kmsService } from '../../services/kms'
import { newVaultService } from '../../services/oAuthVault'

export default class Project extends Command {
  static command = 'affinidi create wallet'

  static usage = 'create wallet [type]'

  static description = 'Use this command to create a new Affinidi wallet.'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = [{ name: 'type' }]

  static flags = {
    output: Flags.enum<ViewFormat>({
      char: 'o',
      description: 'set flag to override default output format view',
      options: ['plaintext', 'json'],
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Project)
    // if (!isAuthenticated()) {
    //   throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'userManagement')
    // }

    const { type } = args

    if (type !== 'kms') {
      throw new CliError('available options are "kms"', StatusCodes.UNAUTHORIZED, 'userManagement')
    }

    const { projectAccessToken } = newVaultService.getProjectToken()

    CliUx.ux.action.start('Creating seed and key')
    const seedData = await kmsService.createSeed(projectAccessToken)
    const keyData = await kmsService.createKey(projectAccessToken, seedData.id)

    displayOutput({
      itemToDisplay: JSON.stringify({ seedId: seedData.id, keyId: keyData.id }, null, '  '),
      flag: flags.output,
    })
  }

  async catch(error: CliError) {
    console.error(error)
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()
    const optionsDisplay: DisplayOptions = {
      itemToDisplay: getErrorOutput(
        error,
        Project.command,
        Project.usage,
        Project.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    }
    try {
      const { flags } = await this.parse(Project)
      optionsDisplay.flag = flags.output
      displayOutput(optionsDisplay)
    } catch (_) {
      displayOutput(optionsDisplay)
    }
  }
}
