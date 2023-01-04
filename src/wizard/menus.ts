import { CliUx } from '@oclif/core'

import { selectNextStep } from '../user-actions/inquirer'
import { defaultWizardMessages, wizardStatus, wizardStatusMessage } from '../render/functions'
import Start, { getStatus, logout as logoutF } from '../commands/start'
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
import { getProjectmenu } from './projectManagement'
import { getSchemamenu } from './shemaManagement'

export const getAuthmenu = async (): Promise<void> => {
  CliUx.ux.info(
    wizardStatusMessage(
      wizardStatus({ messages: defaultWizardMessages, breadcrumbs: Start.breadcrumbs }),
    ),
  )
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.AUTH_MENU))
  switch (nextStep) {
    case 'login':
      await Login.run(['-o', 'plaintext', '-w'])
      Start.breadcrumbs.push(nextStep)
      break
    case 'sign-up':
      await SignUp.run([])
      Start.breadcrumbs.push(nextStep)
      break
    default:
      process.exit(0)
  }
}

export const getMainmenu = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.MAIN_MENU))
  switch (nextStep) {
    case manageProjects:
      Start.breadcrumbs.push(nextStep)
      await getProjectmenu()
      break
    case manageSchemas:
      Start.breadcrumbs.push(nextStep)
      await getSchemamenu()
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
