import { readFileSync, writeFileSync } from 'fs'
import { resolve as resolvePath } from 'path'
import { CliUx, Command, Interfaces } from '@oclif/core'
import { StatusCodes } from 'http-status-codes'
import { DisplayOptions, displayOutput } from '../../middleware/display'

import { listCommandDescription, buildInvalidCommandUsage } from '../../render/texts'
import { CliError, getErrorOutput } from '../../errors'
import { kmsService } from '../../services/kms'
import { configService } from '../../services'
import { newVaultService } from '../../services/oAuthVault'

export default class Wallet extends Command {
  static command = 'affinidi wallet'

  static summary = 'Use this command to execute operation.'

  static usage = 'wallet [id] [operation] [input] [output]'

  static description = listCommandDescription

  static args = [{ name: 'id' }, { name: 'operation' }, { name: 'input' }, { name: 'output' }]

  static examples: Interfaces.Example[] = [
    {
      description: '????',
      command: '???',
    },
  ]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Wallet)
    // if (!isAuthenticated()) {
    //   throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'userManagement')
    // }
    const { id, operation, input, output } = args

    const { projectAccessToken } = newVaultService.getProjectToken()
    const inputData = JSON.parse(readFileSync(resolvePath(process.cwd(), input)).toString('utf-8'))

    if (operation === 'sign-credential') {
      CliUx.ux.action.start('Signing credential')
      const response = await kmsService.signCredential(projectAccessToken, id, {
        unsignedCredential: inputData,
      })
      writeFileSync(
        resolvePath(process.cwd(), output),
        JSON.stringify(response.signedCredential, null, 2),
      )
    } else if (operation === 'sign-jwt') {
      CliUx.ux.action.start('Signing jwt')
      const response = await kmsService.signJwt(projectAccessToken, id, inputData)
      writeFileSync(resolvePath(process.cwd(), output), response.jwt)
      displayOutput({
        itemToDisplay: response.jwt,
        flag: flags.output,
      })
    }

    // if (type !== 'kms') {
    //   throw new CliError('available options are "kms"', StatusCodes.UNAUTHORIZED, 'userManagement')
    // }
    //
    // CliUx.ux.action.start('Creating seed and key')
    // const seedData = await kmsService.createSeed()
    // const keyData = await kmsService.createKey(seedData.id)
    //
    // displayOutput({
    //   itemToDisplay: JSON.stringify({ seedId: seedData.id, keyId: keyData.id }, null, '  '),
    //   flag: flags.output,
    // })
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()
    const optionsDisplay: DisplayOptions = {
      itemToDisplay: getErrorOutput(
        error,
        Wallet.command,
        Wallet.usage,
        Wallet.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    }
    try {
      const { flags } = await this.parse(Wallet)
      optionsDisplay.flag = flags.output
      displayOutput(optionsDisplay)
    } catch (_) {
      displayOutput(optionsDisplay)
    }
  }
}
