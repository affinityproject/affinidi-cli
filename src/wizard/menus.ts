import { CliUx } from '@oclif/core'

import { selectNextStep } from '../user-actions/inquirer'
import { defaultWizardMessages, wizardStatus, wizardStatusMessage } from '../render/functions'
import { getStatus, logout as logoutF } from './generalFunctions'
import {
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
import { getProjectMenu } from './projectManagement'
import { getSchemaMenu } from './shemaManagement'

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

interface SubMenuPrompts {
  projectPrompt: () => Promise<void>
  schemaPrompt: () => Promise<void>
}

export const getMainMenu = async ({
  projectPrompt,
  schemaPrompt,
}: SubMenuPrompts): Promise<void> => {
  CliUx.ux.info(getStatus())
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.MAIN_MENU))
  switch (nextStep) {
    case manageProjects:
      wizardBreadcrumbs.push(nextStep)
      await projectPrompt()
      break
    case manageSchemas:
      wizardBreadcrumbs.push(nextStep)
      await schemaPrompt()
      break
    case generateApplication:
      // GenerateApplication.run([
      //   `-n ${await applicationName()}`,
      //   `${(await withProxy()) ? '-w' : ''}`,
      //   '-o',
      //   'plaintext',
      // ])
      // this.breadcrumbs.push(nextStep)
      break
    case issueVC:
      break
    case verifyVC:
      // await VerifyVc.run([`-d${await pathToVc()}`, '-o', 'plaintext'])
      // this.breadcrumbs.push(nextStep)
      break
    case logout:
      logoutF(nextStep)
      break
    default:
      process.exit(0)
  }
}

// const callMenu = () => {
//   const projectPrompt = getProjectMenu
//   const schemaPrompt = getSchemaMenu
//   const mainPrompt = getMainMenu({ projectPrompt, schemaPrompt })
// }
