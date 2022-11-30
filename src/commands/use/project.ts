import { CliUx, Command, Flags, Interfaces } from '@oclif/core'
import * as fs from 'fs/promises'
import { StatusCodes } from 'http-status-codes'

import { ProjectSummary } from '../../services/iam/iam.api'
import { iAmService, vaultService, VAULT_KEYS } from '../../services'
import { getSession } from '../../services/user-management'
import { getErrorOutput, CliError, Unauthorized } from '../../errors'
import { selectProject } from '../../user-actions'
import { NextStepsRawMessage } from '../../render/functions'
import { EventDTO } from '../../services/analytics/analytics.api'
import { analyticsService, generateUserMetadata } from '../../services/analytics'
import { isAuthenticated } from '../../middleware/authentication'
import { configService } from '../../services/config'
import { displayOutput } from '../../middleware/display'

type UseFieldType = 'json' | 'json-file'

const setActiveProject = (projectToBeActive: ProjectSummary): void => {
  vaultService.set(VAULT_KEYS.projectId, projectToBeActive.project.projectId)
  vaultService.set(VAULT_KEYS.projectName, projectToBeActive.project.name)
  vaultService.set(VAULT_KEYS.projectAPIKey, projectToBeActive.apiKey.apiKeyHash)
  vaultService.set(VAULT_KEYS.projectDID, projectToBeActive.wallet.did)
}
export default class Project extends Command {
  static command = 'affinidi use'

  static description = 'Defines the project you want to work with.'

  static usage = 'use project [project-id] [FLAGS]'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    output: Flags.enum<UseFieldType>({
      char: 'o',
      options: ['json', 'json-file'],
      description: 'print details of the project to use as JSON',
      default: 'json',
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
    if (!isAuthenticated()) {
      throw new CliError(Unauthorized, StatusCodes.UNAUTHORIZED, 'userManagement')
    }

    let projectId = args['project-id']
    const session = getSession()
    const token = session?.accessToken

    if (!projectId) {
      CliUx.ux.action.start('Fetching projects')
      const projectData = await iAmService.listProjects(token, 0, Number.MAX_SAFE_INTEGER)
      if (projectData.length === 0) {
        CliUx.ux.action.stop('No Projects were found')
        displayOutput(NextStepsRawMessage, session?.account?.id)
        return
      }
      CliUx.ux.action.stop('List of projects: ')
      const maxNameLength = projectData
        .map((p) => p.name.length)
        .reduce((p, c) => Math.max(p, c), 0)

      projectId = await selectProject(projectData, maxNameLength)
    }
    const projectToBeActive = await iAmService.getProjectSummary(token, projectId)
    if (flags.output === 'json-file') {
      await fs.writeFile('projects.json', JSON.stringify(projectToBeActive, null, '  '))
    }
    const userId = session?.account?.id
    setActiveProject(projectToBeActive)
    const analyticsData: EventDTO = {
      name: 'CONSOLE_PROJECT_SET_ACTIVE',
      category: 'APPLICATION',
      component: 'Cli',
      uuid: userId,
      metadata: {
        commandId: 'affinidi.useProject',
        projectId: projectToBeActive?.project?.projectId,
        ...generateUserMetadata(session?.account?.label),
      },
    }

    configService.setCurrentProjectId(projectToBeActive?.project?.projectId)
    await analyticsService.eventsControllerSend(analyticsData)
    if (projectToBeActive.apiKey?.apiKeyHash) {
      projectToBeActive.apiKey.apiKeyHash = ''.padEnd(
        projectToBeActive.apiKey.apiKeyHash?.length,
        '*',
      )
    }
    if (projectToBeActive.wallet?.didUrl) {
      projectToBeActive.wallet.didUrl = ''.padEnd(projectToBeActive.wallet.didUrl?.length, '*')
    }

    displayOutput(JSON.stringify(projectToBeActive, null, '  '), session?.account.id)
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    const userId = JSON.parse(vaultService.get(VAULT_KEYS.session))?.account?.id
    const outputFormat = configService.getOutputFormat(userId)
    CliUx.ux.info(
      getErrorOutput(
        error,
        Project.command,
        Project.usage,
        Project.description,
        outputFormat !== 'plaintext',
      ),
    )
  }
}
