import { Command, CliUx, Flags } from '@oclif/core'
import chalk from 'chalk'
import axios from 'axios'

import { projectNamePrompt } from '../../user-actions'
import { genesisIAMService } from '../../services'
import { CreateProjectInput } from '../../services/iam/iam.api'
import { getErrorOutput, CliError } from '../../errors'
import { EventDTO } from '../../services/analytics/analytics.api'
import { analyticsService, generateUserMetadata } from '../../services/analytics'
import { DisplayOptions, displayOutput } from '../../middleware/display'
import { configService } from '../../services/config'
import { ViewFormat } from '../../constants'
import { newVaultService } from '../../services/oAuthVault'

export default class Project extends Command {
  static command = 'affinidi create project'

  static usage = 'create project [projectName]'

  static description = 'Use this command to create a new Affinidi project.'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = [{ name: 'projectName' }]

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

    let { projectName } = args

    if (!projectName) {
      projectName = await projectNamePrompt()
    }

    const { access_token: accessToken } = newVaultService.getUserToken()
    const account = { userId: 'some-user-id', label: 'yigitcan.u@affinidi.com' }

    const projectNameInput: CreateProjectInput = {
      name: projectName,
    }
    CliUx.ux.action.start('Creating project')
    const projectData = await genesisIAMService.createProject(accessToken, projectNameInput)
    CliUx.ux.action.stop('Project has been successfully created: ')
    const analyticsData: EventDTO = {
      name: 'CONSOLE_PROJECT_CREATED',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: account.userId,
      metadata: {
        projectId: projectData.id,
        commandId: 'affinidi.createProject',
        ...generateUserMetadata(account.label),
      },
    }

    const data = await genesisIAMService.createProjectScopedToken(accessToken, projectData.id)
    newVaultService.setProjectToken(data, projectData.id)

    await analyticsService.eventsControllerSend(analyticsData)
    displayOutput({ itemToDisplay: JSON.stringify(projectData, null, '  '), flag: flags.output })
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
