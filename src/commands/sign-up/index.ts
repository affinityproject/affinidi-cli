import { Command, CliUx } from '@oclif/core'
import * as EmailValidator from 'email-validator'

import {
  acceptConditionsAndPolicy,
  enterEmailPrompt,
  enterOTPPrompt,
  AnswerYes,
  analyticsConsentPrompt,
} from '../../user-actions'
import { userManagementService } from '../../services'
import { vaultService } from '../../services/vault/typedVaultService'
import { CliError, WrongEmailError, getErrorOutput } from '../../errors'
import { WelcomeUserStyledMessage } from '../../render/functions'
import { createOrUpdateConfig, createSession, parseJwt } from '../../services/user-management'
import { EventDTO } from '../../services/analytics/analytics.api'
import { analyticsService, generateUserMetadata } from '../../services/analytics'
import CreateProject from '../create/project'

const MAX_EMAIL_ATTEMPT = 3

export default class SignUp extends Command {
  static command = 'affinidi sign-up'

  static description = 'Use this command with your email address to create a new Affinid account.'

  static examples = ['<%= config.bin %> <%= command.id %> example@email.com']

  static args = [{ name: 'email' }]

  public async run(): Promise<void> {
    const { args } = await this.parse(SignUp)
    let { email } = args
    if (!email) {
      email = await enterEmailPrompt()
    }

    let wrongEmailCount = 0
    while (!EmailValidator.validate(email)) {
      email = await enterEmailPrompt()
      wrongEmailCount += 1
      if (wrongEmailCount === MAX_EMAIL_ATTEMPT) {
        CliUx.ux.error(WrongEmailError)
      }
    }

    const answer = await acceptConditionsAndPolicy()
    if (answer !== AnswerYes) {
      CliUx.ux.info("You must accept the conditions and policy to use Affinidi's services")
      return
    }

    const wantsToOptIn = await analyticsConsentPrompt()

    // http request to affinidi sign-up endpoint
    CliUx.ux.action.start('Start signing-up to Affinidi')
    const token = await userManagementService.signUp(email)

    // mask input after enter is pressed
    CliUx.ux.action.start('Verifying the OTP')
    const confirmationCode = await enterOTPPrompt()

    CliUx.ux.action.start('Verifying the OTP')
    const sessionToken = await userManagementService.confirmAndGetToken(
      token,
      confirmationCode,
      'signup',
    )
    CliUx.ux.action.stop('OTP verified')
    CliUx.ux.action.stop('Sign-up successful')

    // Get userId from cookie. Slice removes `console_authtoken=` prefix.
    const { userId } = parseJwt(sessionToken.slice('console_authtoken='.length))
    const sessionWithoutPrefix = sessionToken.replace('console_authtoken=', '')
    vaultService.clear()
    createSession(email, userId, sessionWithoutPrefix)
    createOrUpdateConfig({ userId, analyticsOptIn: wantsToOptIn })

    const analyticsData: EventDTO = {
      name: 'CONSOLE_USER_SIGN_UP',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: userId,
      metadata: {
        commandId: 'affinidi.sign-up',
        ...generateUserMetadata(email),
      },
    }
    await analyticsService.eventsControllerSend(analyticsData)
    CliUx.ux.info(`${WelcomeUserStyledMessage}\n`)

    await CreateProject.run(['Default Project'])
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    CliUx.ux.info(getErrorOutput(error, SignUp.command, SignUp.command, SignUp.description, false))
  }
}
