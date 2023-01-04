import { CliUx, Command } from '@oclif/core'
import { wizardStatusMessage, wizardStatus, defaultWizardMessages } from '../render/functions'

import { isAuthenticated } from '../middleware/authentication'
import { getSession } from '../services/user-management'
import { iAmService } from '../services'
import { vaultService } from '../services/vault/typedVaultService'
import Logout from './logout'

import { CliError, getErrorOutput } from '../errors'
import { displayOutput } from '../middleware/display'
import { wizardMap, WizardMenus } from '../constants'
// eslint-disable-next-line import/no-cycle
import { createProjectF, getProjectmenu } from '../wizard/projectManagement'
// eslint-disable-next-line import/no-cycle
import {
  getGoBackProjectMenu,
  getGoBackSchemaMenu,
  showDetailedSchemaMenu,
} from '../wizard/submenus'
// eslint-disable-next-line import/no-cycle
import { getSchemamenu } from '../wizard/shemaManagement'
import { getAuthmenu, getMainmenu } from '../wizard/menus'

// import { applicationName, pathToVc, withProxy } from '../user-actions'
// import VerifyVc from './verify-vc'
// import GenerateApplication from './generate-application'

export const getStatus = (): string => {
  const {
    account: { label: userEmail },
  } = getSession()
  const {
    project: { projectId },
  } = vaultService.getActiveProject()
  const status = wizardStatusMessage(
    wizardStatus({
      messages: defaultWizardMessages,
      breadcrumbs: Start.breadcrumbs,
      userEmail,
      projectId,
    }),
  )
  return `\n${status}\n`
}

export const logout = async (nextStep: string): Promise<void> => {
  await Logout.run(['-o', 'plaintext'])
  Start.breadcrumbs.push(nextStep)
}
export default class Start extends Command {
  static description = 'Start provides a way to guide you from end to end.'

  static command = 'affinidi start'

  static usage = 'start'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static breadcrumbs: string[] = []

  menuMap = new Map<WizardMenus, () => void>([
    [WizardMenus.AUTH_MENU, getAuthmenu.prototype],
    [WizardMenus.MAIN_MENU, getMainmenu.prototype],
    [WizardMenus.PROJECT_MENU, getProjectmenu.prototype],
    [WizardMenus.SCHEMA_MENU, getSchemamenu.prototype],
    [WizardMenus.GO_BACK_PROJECT_MENU, getGoBackProjectMenu.prototype],
    [WizardMenus.GO_BACK_SCHEMA_MENU, getGoBackSchemaMenu.prototype],
    [WizardMenus.SHOW_DETAILED_SCHEMA_MENU, showDetailedSchemaMenu.prototype],
  ])

  public async run(): Promise<void> {
    if (!isAuthenticated()) {
      await getAuthmenu()
    }
    const { consoleAuthToken: token } = getSession()
    const projects = await iAmService.listProjects(token, 0, 10)
    if (projects.length === 0) {
      await createProjectF()
    }

    await getMainmenu()
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    displayOutput({
      itemToDisplay: getErrorOutput(error, Start.command, Start.usage, Start.description, false),
      err: true,
    })
    const prevStep = Start.breadcrumbs[Start.breadcrumbs.length - 1]
    wizardMap.forEach((value, key): void => {
      if (value.includes(prevStep)) {
        this.menuMap.get(key)()
      }
    })
  }
}
