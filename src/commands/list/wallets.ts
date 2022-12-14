import { Command, CliUx, Flags } from '@oclif/core'
import { stringify as csv_stringify } from 'csv-stringify'

import { getErrorOutput, CliError } from '../../errors'
import { configService } from '../../services/config'
import { DisplayOptions, displayOutput } from '../../middleware/display'
import { newVaultService } from '../../services/oAuthVault'
import { kmsService } from '../../services/kms'

type ListProjectsOutputType = 'json' | 'table' | 'csv'

export default class Wallets extends Command {
  static command = 'affinidi list wallets'

  static usage = 'list wallets [FLAGS]'

  static description = 'Listing of all wallets you created.'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --skip=2 --limit=5 --output=csv-file',
  ]

  static flags = {
    output: Flags.enum<ListProjectsOutputType>({
      char: 'o',
      description: 'Project listing output format',
      options: ['json', 'table', 'csv'],
    }),
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Wallets)
    let { output } = flags
    // if (!isAuthenticated()) {
    //   throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'userManagement')
    // }

    const { projectAccessToken } = newVaultService.getProjectToken()
    // const projectAccessToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyMjgxOTNmLWRjNTktNDQyOC05MDk5LTBlZmQ3MzlkYTBkZCIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiaHR0cHM6Ly9ib3JpbmctZ2FsaWxlby1iamhnNHQ4NWZpLnByb2plY3RzLm9yeWFwaXMuY29tL29hdXRoMi90b2tlbiIsImh0dHBzOi8vYXBpLmFwLXNvdXRoZWFzdC0xLmFmZmluaWRpLmlvIl0sImNsaWVudF9pZCI6IjBjMWE3ZTQ1LWMzMWEtNDIyZi05YzdkLWI2NzE5ZTMxZDVhMSIsImV4cCI6MTY3MTAxNjU5MSwiZXh0Ijp7fSwiaWF0IjoxNjcxMDEyOTkxLCJpc3MiOiJodHRwczovL2JvcmluZy1nYWxpbGVvLWJqaGc0dDg1ZmkucHJvamVjdHMub3J5YXBpcy5jb20iLCJqdGkiOiIzOGE0OWM1OS05ODNiLTQ0NzYtOGY2ZC03NDc3MmFmOWFjZjEiLCJuYmYiOjE2NzEwMTI5OTEsInNjcCI6WyJvZmZsaW5lIiwib3BlbmlkIiwib2ZmbGluZV9hY2Nlc3MiXSwic3ViIjoiYXJpOmlhbTo6NTMwMDZkZTgtOGNhYS00YTZhLTkwNWMtOTI0ODIwZjRiNzVlOnVzZXIvZDhjYmIwMzgtZmMwMC00MzgxLThhNmYtNjgxN2NlYjE1YzdkIn0.e4Vur_d0Y50IV8SEjlQqk1Ph5R-cPi5sy3zPtU1H6WOAEIunS5PeF6tWQ4nA4IuFp_1uTVdw4qd-luafd98VgOtPK9OBWK7zwzx4Az6MVGBev6R1iz_cX2pidnPkoUfKoSYCEScKd34M4BMuZrbrktV3kwLzjjA6m7EwMPbjjp7YIYXaRhVnNbstR_mxddUXoGrggiUmRizo9Jfnv9_j-9kxjrsxGAQnmoZOSQU5E0ZwYP6ufUQ5hA2DVFCE0LdnKG8mTW55wLHPzHeZb8u_C7Zzxapn4bm7D63mQ4uEaSSflvmIC89K5UyBE001MsWcPG-FcSruLfkFyhIZx5_kPF-DMyyUZmFy0LuCIb_wVHnR5MbkYOhuGWfDLCSWeeoygh2QrVGx9HvDw6-EvhYM-8gkZ__vvTYh3VOyZ66GEkaxrNoXrL3gt04j-opc77h4vH_TYDqNprssE6k1-zdiyK3mvLr7dbAxSHVQwDk7ZkX2Ty77B88zeTnQMbBNzpCwL1Q2QhpLra4_DJKAyJjyVZKeTpru-B_DpcFFSyuAz-nfsgo6SvjbVI0PhD0Cr3Q9TnFRDUm9QpKCi0g-ToJagsmOgTee8Z0P-8ldMy--UBjWyrBL2bD7iQwvWyahkDF8d1TxI2uxmuCbqw3D-z2J_tJ9-Omdff3LR2Xjfkydu9M'

    CliUx.ux.action.start('Fetching list of projects')
    const { records } = await kmsService.listKeys(projectAccessToken)
    CliUx.ux.action.stop()
    const outputFormat = configService.getOutputFormat()
    if (!output && outputFormat === 'plaintext') {
      output = 'table'
    } else if (!flags.output) {
      output = 'json'
    }
    switch (output) {
      case 'table':
        CliUx.ux.table(
          records.map((data) => ({
            provider: 'KMS',
            id: data.id,
            derivationPath: data.derivationPath,
          })),
          { provider: {}, id: {}, derivationPath: {} },
        )
        break
      case 'csv':
        csv_stringify(records, { header: true }).pipe(process.stdout)
        break
      case 'json':
        CliUx.ux.info(JSON.stringify(records, null, '  '))
        break
      default:
        throw new CliError('Unknown output format', 0, 'schema')
    }
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    const outputFormat = configService.getOutputFormat()
    const optionsDisplay: DisplayOptions = {
      itemToDisplay: getErrorOutput(
        error,
        Wallets.command,
        Wallets.usage,
        Wallets.description,
        outputFormat !== 'plaintext',
      ),
      err: true,
    }
    try {
      const { flags } = await this.parse(Wallets)
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
