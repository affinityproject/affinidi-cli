import { Command, CliUx, Flags } from '@oclif/core'

import { analyticsService, generateUserMetadata } from '../../services/analytics'
import { EventDTO } from '../../services/analytics/analytics.api'
import { vaultService } from '../../services/vault/typedVaultService'
import { getErrorOutput, CliError } from '../../errors'

import { DisplayOptions, displayOutput } from '../../middleware/display'
import { ViewFormat } from '../../constants'
import { configService } from '../../services'

import { checkErrorFromWizard } from '../../wizard/helpers'
import { createSession } from '../../services/user-management'

const { ClientSDK } = require('affinidi-client-sdk/modules/core')

export default class Login extends Command {
  static command = 'affinidi login'

  static usage = 'login'

  static description =
    'Use this command to log-in with your email address and use Affinidi privacy preserving services."'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    output: Flags.enum<ViewFormat>({
      char: 'o',
      description: 'set flag to override default output format view',
      options: ['plaintext', 'json'],
    }),
    isWizard: Flags.boolean({
      char: 'w',
      hidden: true,
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Login)

    CliUx.ux.action.start('Start logging in to Affinidi')
    const token = await ClientSDK.signUpOrSignIn()

    CliUx.ux.action.stop('Log-in successful')

    // TODO  get user's email and id from ClientSDK
    const email = 'test@example.com'
    const userId = 'user-id'

    vaultService.setTimeStamp()
    const analyticsData: EventDTO = {
      name: 'CONSOLE_USER_SIGN_IN',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: userId,
      metadata: {
        commandId: 'affinidi.login',
        ...generateUserMetadata(email),
      },
    }

    await analyticsService.eventsControllerSend(analyticsData)

    createSession(email, userId, token)

    displayOutput({ itemToDisplay: 'You are authenticated', flag: flags.output })
    displayOutput({ itemToDisplay: `Welcome to Affinidi ${email}!`, flag: flags.output })
  }

  async catch(error: CliError) {
    if (checkErrorFromWizard(error)) throw error
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()
    const optionsDisplay: DisplayOptions = {
      itemToDisplay: getErrorOutput(
        error,
        Login.command,
        Login.usage,
        Login.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    }
    try {
      const { flags } = await this.parse(Login)
      optionsDisplay.flag = flags.output
      displayOutput(optionsDisplay)
    } catch (_) {
      displayOutput(optionsDisplay)
    }
  }
}
