/* eslint-disable @typescript-eslint/no-use-before-define */
import { CliUx } from '@oclif/core'

import { selectNextStep } from '../user-actions/inquirer'
import { defaultWizardMessages, wizardStatus, wizardStatusMessage } from '../render/functions'
import { getStatus, logout as logoutF } from './generalFunctions'
import {
  backToMainMenu,
  generateApplication,
  issueVC,
  logout,
  manageProjects,
  manageSchemas,
  verifyVC,
  wizardMap,
  WizardMenus,
} from '../constants'
import Login from '../commands/login'
import SignUp from '../commands/sign-up'
import { wizardBreadcrumbs } from './attributes'
import { executeProjectCommand, executeProjectPostCommand } from './projectManagement'
import { executeSchemaCommand, executeSchemaPostCommand } from './shemaManagement'

export const getAuthmenu = async (): Promise<void> => {
  CliUx.ux.info(
    wizardStatusMessage(
      wizardStatus({ messages: defaultWizardMessages, breadcrumbs: wizardBreadcrumbs }),
    ),
  )
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.AUTH_MENU))
  switch (nextStep) {
    case 'login':
      await Login.run(['-o', 'plaintext', '-w'])
      wizardBreadcrumbs.push(nextStep)
      break
    case 'sign-up':
      await SignUp.run([])
      wizardBreadcrumbs.push(nextStep)
      break
    default:
      process.exit(0)
  }
}

export const menuSelector = async (step: string) => {
  CliUx.ux.info(getStatus())
  wizardBreadcrumbs.push(step)
  let s = ''
  switch (step) {
    case WizardMenus.MAIN_MENU:
    case backToMainMenu:
      await menuSelector(await selectNextStep(wizardMap.get(WizardMenus.MAIN_MENU)))
      break
    case WizardMenus.PROJECT_MENU:
    case manageProjects:
      s = await selectNextStep(wizardMap.get(WizardMenus.PROJECT_MENU))
      await executeProjectCommand(s, goToMain, goToProject)
      break
    case WizardMenus.GO_BACK_PROJECT_MENU:
      s = await selectNextStep(wizardMap.get(WizardMenus.GO_BACK_PROJECT_MENU))
      await executeProjectPostCommand(s, goToMain, goToMainProject)
      break
    case WizardMenus.SCHEMA_MENU:
    case manageSchemas:
      s = await selectNextStep(wizardMap.get(WizardMenus.SCHEMA_MENU))
      await executeSchemaCommand(s, goToMain, goToSchema)
      break
    case WizardMenus.GO_BACK_SCHEMA_MENU:
      s = await selectNextStep(wizardMap.get(WizardMenus.GO_BACK_SCHEMA_MENU))
      await executeSchemaPostCommand(s, goToMain, goToMainSchema)
      break
    case generateApplication:
      break
    case issueVC:
      break
    case verifyVC:
    case logout:
      logoutF(step)
      break
    default:
      process.exit(0)
  }
}

async function goToMain() {
  await menuSelector(WizardMenus.MAIN_MENU)
}

async function goToMainProject() {
  await menuSelector(WizardMenus.PROJECT_MENU)
}

async function goToProject() {
  await menuSelector(WizardMenus.GO_BACK_PROJECT_MENU)
}

async function goToMainSchema() {
  await menuSelector(WizardMenus.SCHEMA_MENU)
}

async function goToSchema() {
  await menuSelector(WizardMenus.GO_BACK_SCHEMA_MENU)
}
