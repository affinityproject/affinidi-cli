import { CliUx } from '@oclif/core'

import { getStatus, logout as logoutF } from './generalFunctions'
import {
  backToMainMenu,
  backToProjectMenu,
  changeActiveProject,
  createProject,
  logout,
  showActiveProject,
  showDetailedProject,
} from '../constants'
import UseProject from '../commands/use/project'
import ShowProject from '../commands/show/project'
import CreateProject from '../commands/create/project'
import { getSession } from '../services/user-management'
import { defaultWizardMessages, wizardStatus, wizardStatusMessage } from '../render/functions'
import { wizardBreadcrumbs } from './attributes'
import { AsyncVoidFn } from './types'

export const useProject = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  await UseProject.run(['-o', 'plaintext'])
}

export const showProject = async (active: boolean): Promise<void> => {
  CliUx.ux.info(getStatus())
  if (active) {
    await ShowProject.run(['-a', '-o', 'plaintext'])
    return
  }
  await ShowProject.run(['-o', 'plaintext'])
}
export const createProjectF = async (): Promise<void> => {
  const {
    account: { label: userEmail },
  } = getSession()
  CliUx.ux.info(
    wizardStatusMessage(
      wizardStatus({
        messages: defaultWizardMessages,
        breadcrumbs: wizardBreadcrumbs,
        userEmail,
      }),
    ),
  )
  await CreateProject.run(['-o', 'plaintext'])
  wizardBreadcrumbs.push('create a project')
}

export const executeProjectCommand = async (
  step: string,
  toMain: AsyncVoidFn,
  toProject: AsyncVoidFn,
): Promise<void> => {
  switch (step) {
    case changeActiveProject:
      await useProject()
      wizardBreadcrumbs.push(step)
      break
    case createProject:
      await createProjectF()
      break
    case showActiveProject:
      await showProject(true)
      wizardBreadcrumbs.push(step)
      break
    case showDetailedProject:
      await showProject(false)
      wizardBreadcrumbs.push(step)
      break
    case backToMainMenu:
      await toMain()
      break
    case logout:
      logoutF(step)
      return
    default:
      process.exit(0)
  }

  await toProject()
}

export const executeProjectPostCommand = async (
  step: string,
  toMain: AsyncVoidFn,
  toProject: AsyncVoidFn,
): Promise<void> => {
  switch (step) {
    case backToProjectMenu:
      await toProject()
      break
    case backToMainMenu:
      await toMain()
      break
    default:
      process.exit(0)
  }
}
