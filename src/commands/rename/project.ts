import { Args, Command, Flags, ux } from '@oclif/core'
import { StatusCodes } from 'http-status-codes'

import { CliError, getErrorOutput, Unauthorized } from '../../errors'

import { DisplayOptions, displayOutput } from '../../middleware/display'
import { NextStepsRawMessage } from '../../render/functions'
import { configService, iAmService } from '../../services'
import { getSession } from '../../services/user-management'
import { newProjectName, selectProject } from '../../user-actions'
import { checkErrorFromWizard } from '../../wizard/helpers'
import { isAuthenticated } from '../../middleware/authentication'
import { EventDTO } from '../../services/analytics/analytics.api'
import { analyticsService, generateUserMetadata } from '../../services/analytics'
import { output } from '../../customFlags/outputFlag'

export default class Project extends Command {
  static command = 'affinidi rename project'

  static description = 'Use this command to rename an existing project'

  static usage = 'rename project [projectId]'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static args = { projectId: Args.string() }

  static flags = {
    output,
    name: Flags.string({
      char: 'n',
      description: 'new name of the project',
    }),
  }

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Project)
    if (!isAuthenticated()) {
      throw new CliError(`${Unauthorized}`, StatusCodes.UNAUTHORIZED, 'userManagement')
    }
    const {
      consoleAuthToken: token,
      account: { userId, label },
    } = getSession()
    let { projectId } = args
    let newName = flags.name

    if (!projectId) {
      ux.action.start('Fetching projects')
      const projectData = await iAmService.listProjects(token, 0, Number.MAX_SAFE_INTEGER)
      if (projectData.length === 0) {
        ux.action.stop('No Projects were found')
        displayOutput({ itemToDisplay: NextStepsRawMessage, flag: flags.output })
        return
      }
      ux.action.stop('List of projects: ')
      const maxNameLength = projectData
        .map((p) => p.name.length)
        .reduce((p, c) => Math.max(p, c), 0)

      projectId = await selectProject(projectData, maxNameLength)
    }
    if (!newName) {
      newName = await newProjectName()
    }
    await iAmService.renameProject(projectId, newName, token)
    const renamedProjectSumamry = await iAmService.getProjectSummary(token, projectId)
    const analyticsData: EventDTO = {
      name: 'CONSOLE_PROJECT_RENAMED',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: userId,
      metadata: {
        commandId: 'affinidi.renameProject',
        projectId: renamedProjectSumamry.project.projectId,
        ...generateUserMetadata(label),
      },
    }
    await analyticsService.eventsControllerSend(analyticsData)
    const test = process.env.NODE_ENV === 'test'
    if (renamedProjectSumamry.apiKey?.apiKeyHash && !test) {
      renamedProjectSumamry.apiKey.apiKeyHash = ''.padEnd(
        renamedProjectSumamry.apiKey.apiKeyHash?.length,
        '*',
      )
    }
    if (renamedProjectSumamry.wallet?.didUrl && !test) {
      renamedProjectSumamry.wallet.didUrl = ''.padEnd(
        renamedProjectSumamry.wallet.didUrl?.length,
        '*',
      )
    }
    displayOutput({
      itemToDisplay: JSON.stringify(renamedProjectSumamry, null, '  '),
      flag: flags.output,
    })
  }

  async catch(error: CliError) {
    if (checkErrorFromWizard(error)) throw error
    ux.action.stop('failed')
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
