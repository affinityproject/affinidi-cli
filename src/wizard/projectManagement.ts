/* eslint-disable import/no-cycle */
import { CliUx } from '@oclif/core'

import { selectNextStep } from '../user-actions/inquirer'
import Start, { getStatus, logout as logoutF } from '../commands/start'
import {
  backToMainMenu,
  changeActiveProject,
  createProject,
  logout,
  showActiveProject,
  showDetailedProject,
  wizardMap,
  WizardMenus,
} from '../constants'
import UseProject from '../commands/use/project'
import ShowProject from '../commands/show/project'
import CreateProject from '../commands/create/project'
import { getSession } from '../services/user-management'
import { defaultWizardMessages, wizardStatus, wizardStatusMessage } from '../render/functions'
import { getGoBackProjectMenu } from './submenus'
import { getMainmenu } from './menus'

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
        breadcrumbs: Start.breadcrumbs,
        userEmail,
      }),
    ),
  )
  await CreateProject.run(['-o', 'plaintext'])
  Start.breadcrumbs.push('create a project')
}

export const getProjectmenu = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.PROJECT_MENU))
  switch (nextStep) {
    case changeActiveProject:
      await useProject()
      Start.breadcrumbs.push(nextStep)
      await getGoBackProjectMenu()
      break
    case createProject:
      await createProjectF()
      await getGoBackProjectMenu()
      break
    case showActiveProject:
      await showProject(true)
      Start.breadcrumbs.push(nextStep)
      await getGoBackProjectMenu()
      break
    case showDetailedProject:
      await showProject(false)
      Start.breadcrumbs.push(nextStep)
      await getGoBackProjectMenu()
      break
    case backToMainMenu:
      await getMainmenu()
      break
    case logout:
      logoutF(nextStep)
      break
    default:
      process.exit(0)
  }
}
