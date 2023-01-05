import { CliUx, Command } from '@oclif/core'

import { isAuthenticated } from '../middleware/authentication'
import { getSession } from '../services/user-management'
import { iAmService } from '../services'

import { CliError, getErrorOutput } from '../errors'
import { displayOutput } from '../middleware/display'
import { wizardMap, WizardMenus } from '../constants'
import { wizardBreadcrumbs } from '../wizard/attributes'
import { createProjectF } from '../wizard/projectManagement'
import { getAuthmenu, menuSelector } from '../wizard/menus'
import { showDetailedSchemaMenu } from '../wizard/shemaManagement'

export default class Start extends Command {
  static description = 'Start provides a way to guide you from end to end.'

  static command = 'affinidi start'

  static usage = 'start'

  static examples = ['<%= config.bin %> <%= command.id %>']

  // static breadcrumbs: string[] = []

  menuMap = new Map<WizardMenus, () => Promise<void>>([
    [WizardMenus.AUTH_MENU, getAuthmenu.prototype],
    [WizardMenus.MAIN_MENU, getAuthmenu.prototype],
    [WizardMenus.PROJECT_MENU, getAuthmenu.prototype],
    [WizardMenus.SCHEMA_MENU, getAuthmenu.prototype],
    [WizardMenus.GO_BACK_PROJECT_MENU, getAuthmenu.prototype],
    [WizardMenus.GO_BACK_SCHEMA_MENU, getAuthmenu.prototype],
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

    await menuSelector(WizardMenus.MAIN_MENU)
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    displayOutput({
      itemToDisplay: getErrorOutput(error, Start.command, Start.usage, Start.description, false),
      err: true,
    })
    const prevStep = wizardBreadcrumbs[wizardBreadcrumbs.length - 1]
    wizardMap.forEach((value, key): void => {
      if (value.includes(prevStep)) {
        this.menuMap.get(key)()
      }
    })
  }
}
