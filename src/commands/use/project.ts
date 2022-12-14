import { CliUx, Command, Flags, Interfaces } from '@oclif/core'

import { genesisIAMService } from '../../services'
import { getErrorOutput, CliError } from '../../errors'
import { NextStepsRawMessage } from '../../render/functions'
import { configService } from '../../services/config'
import { DisplayOptions, displayOutput } from '../../middleware/display'
import { ViewFormat } from '../../constants'
import { newVaultService } from '../../services/oAuthVault'
import { selectGenesisProject } from '../../user-actions/inquirer'

export default class Project extends Command {
  static command = 'affinidi use'

  static description = 'Defines the project you want to work with.'

  static usage = 'use project [project-id] [FLAGS]'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    output: Flags.enum<ViewFormat>({
      char: 'o',
      options: ['plaintext', 'json'],
      description: 'set flag to override default output format view',
    }),
  }

  static args: Interfaces.Arg[] = [
    {
      name: 'project-id',
      description: 'the ID of the project to use',
    },
  ]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Project)
    // if (!isAuthenticated()) {
    //   throw new CliError(`${Unauthorized}`, StatusCodes.UNAUTHORIZED, 'userManagement')
    // }

    let projectId = args['project-id']
    let projectData
    const { access_token: accessToken } = newVaultService.getUserToken()

    if (!projectId) {
      CliUx.ux.action.start('Fetching projects')
      const projects = await genesisIAMService.listProjects(accessToken, 0, Number.MAX_SAFE_INTEGER)
      if (projects.length === 0) {
        CliUx.ux.action.stop('No Projects were found')
        displayOutput({ itemToDisplay: NextStepsRawMessage, flag: flags.output })
        return
      }
      CliUx.ux.action.stop('List of projects: ')
      const maxNameLength = projects.map((p) => p.name.length).reduce((p, c) => Math.max(p, c), 0)

      projectId = await selectGenesisProject(projects, maxNameLength)
      projectData = projects.find((project) => project.id.trim() === projectId.trim())
    } else {
      const projects = await genesisIAMService.listProjects(accessToken, 0, Number.MAX_SAFE_INTEGER)

      CliUx.ux.action.start('Fetching projects')
      projectData = projects.find((project) => project.id.trim() === projectId.trim())
      CliUx.ux.action.stop()
    }

    const data = await genesisIAMService.createProjectScopedToken(accessToken, projectId)
    newVaultService.setProjectToken(data, projectId)

    displayOutput({
      itemToDisplay: JSON.stringify(projectData, null, '  '),
      flag: flags.output,
    })
  }

  async catch(error: CliError) {
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
