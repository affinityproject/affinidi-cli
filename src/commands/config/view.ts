import { CliUx, Command } from '@oclif/core'
import { StatusCodes } from 'http-status-codes'

import { configService } from '../../services/config'
import { CliError, getErrorOutput, Unauthorized } from '../../errors'
import { isAuthenticated } from '../../middleware/authentication'
import { displayOutput } from '../../middleware/display'

export default class View extends Command {
  static command = 'affinidi config view'

  static description = 'Use this command to configure the format of output'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static usage = 'config view [plaintext | json]'

  static args = [
    {
      name: 'format',
      required: true,
      options: ['plaintext', 'json'],
      description: 'format of the output',
    },
  ]

  public async run(): Promise<void> {
    const { args } = await this.parse(View)
    const { format } = args
    if (!isAuthenticated()) {
      throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'userManagement')
    }

    configService.setOutputFormat(format)
    displayOutput({ itemToDisplay: `Default output format view is set to ${format}` })
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()

    displayOutput({
      itemToDisplay: getErrorOutput(
        error,
        View.command,
        View.usage,
        View.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    })
  }
}
