import { CliUx, Command } from '@oclif/core'
import { wizardStatusMessage, wizardStatus, defaultWizardMessages } from '../render/functions'

import { isAuthenticated } from '../middleware/authentication'
import { selectNextStep } from '../user-actions/inquirer'
import Login from './login'
import SignUp from './sign-up'
import { getSession } from '../services/user-management'
import { iAmService } from '../services'
import { vaultService } from '../services/vault/typedVaultService'
import CreateProject from './create/project'
import Logout from './logout'
import ShowProject from './show/project'
import UseProject from './use/project'
import { CliError, getErrorOutput } from '../errors'
import { displayOutput } from '../middleware/display'
import {
  backToMainMenu,
  backToProjectMenu,
  backtoSchemaMenu,
  changeActiveProject,
  chooseSchmeaFromList,
  createProject,
  createSchema,
  generateApplication,
  issueVC,
  logout,
  manageProjects,
  manageSchemas,
  showActiveProject,
  showDetailedProject,
  showDetailedSchema,
  showSchemas,
  typeSchemaId,
  verifyVC,
  wizardMap,
  WizardMenus,
} from '../constants'
import ListSchemas from './list/schemas'
import ShowSchema from './show/schema'
import { schemaId } from '../user-actions'
// import { applicationName, pathToVc, withProxy } from '../user-actions'
// import VerifyVc from './verify-vc'
// import GenerateApplication from './generate-application'

export default class Start extends Command {
  static description = 'Start provides a way to guide you from end to end.'

  static command = 'affinidi start'

  static usage = 'start'

  static examples = ['<%= config.bin %> <%= command.id %>']

  breadcrumbs: string[] = []

  menuMap = new Map<WizardMenus, () => void>([
    [WizardMenus.AUTH_MENU, this.getAuthmenu.prototype],
    [WizardMenus.MAIN_MENU, this.getMainmenu.prototype],
    [WizardMenus.PROJECT_MENU, this.getProjectmenu.prototype],
    [WizardMenus.SCHEMA_MENU, this.getSchemamenu.prototype],
    [WizardMenus.GO_BACK_PROJECT_MENU, this.getGoBackProjectMenu.prototype],
    [WizardMenus.GO_BACK_SCHEMA_MENU, this.getGoBackSchemaMenu.prototype],
    [WizardMenus.SHOW_DETAILED_SCHEMA_MENU, this.showDetailedSchemaMenu.prototype],
  ])

  public async run(): Promise<void> {
    if (!isAuthenticated()) {
      await this.getAuthmenu()
    }
    const { consoleAuthToken: token } = getSession()
    const projects = await iAmService.listProjects(token, 0, 10)
    if (projects.length === 0) {
      await this.createProject()
    }

    await this.getMainmenu()
  }

  async catch(error: CliError) {
    CliUx.ux.action.stop('failed')
    displayOutput({
      itemToDisplay: getErrorOutput(error, Start.command, Start.usage, Start.description, false),
      err: true,
    })
    const prevStep = this.breadcrumbs[this.breadcrumbs.length - 1]
    wizardMap.forEach((value, key): void => {
      if (value.includes(prevStep)) {
        this.menuMap.get(key)()
      }
    })
  }

  private async getAuthmenu() {
    CliUx.ux.info(
      wizardStatusMessage(
        wizardStatus({ messages: defaultWizardMessages, breadcrumbs: this.breadcrumbs }),
      ),
    )
    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.AUTH_MENU))
    switch (nextStep) {
      case 'login':
        await Login.run(['-o', 'plaintext', '-w'])
        this.breadcrumbs.push(nextStep)
        break
      case 'sign-up':
        await SignUp.run([])
        this.breadcrumbs.push(nextStep)
        break
      default:
        process.exit(0)
    }
  }

  private async getMainmenu() {
    CliUx.ux.info(this.getStatus())
    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.MAIN_MENU))
    switch (nextStep) {
      case manageProjects:
        this.breadcrumbs.push(nextStep)
        await this.getProjectmenu()
        break
      case manageSchemas:
        this.breadcrumbs.push(nextStep)
        await this.getSchemamenu()
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
        this.logout(nextStep)
        break
      default:
        process.exit(0)
    }
  }

  private async getProjectmenu() {
    CliUx.ux.info(this.getStatus())
    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.PROJECT_MENU))
    switch (nextStep) {
      case changeActiveProject:
        await this.useProject()
        this.breadcrumbs.push(nextStep)
        await this.getGoBackProjectMenu()
        break
      case createProject:
        await this.createProject()
        await this.getGoBackProjectMenu()
        break
      case showActiveProject:
        await this.showProject(true)
        this.breadcrumbs.push(nextStep)
        await this.getGoBackProjectMenu()
        break
      case showDetailedProject:
        await this.showProject(false)
        this.breadcrumbs.push(nextStep)
        await this.getGoBackProjectMenu()
        break
      case backToMainMenu:
        await this.getMainmenu()
        break
      case logout:
        this.logout(nextStep)
        break
      default:
        process.exit(0)
    }
  }

  private async getSchemamenu() {
    CliUx.ux.info(this.getStatus())
    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.SCHEMA_MENU))
    switch (nextStep) {
      case showSchemas:
        await this.listSchemas()
        this.breadcrumbs.push(showDetailedSchema)
        await this.getGoBackSchemaMenu()
        break
      case showDetailedSchema:
        await this.showDetailedSchemaMenu()
        break
      case createSchema:
        break
      case backToMainMenu:
        await this.getMainmenu()
        break
      case logout:
        this.logout(nextStep)
        break
      default:
        process.exit(0)
    }
  }

  private async listSchemas() {
    CliUx.ux.info(this.getStatus())
    await ListSchemas.run(['-w'])
    this.breadcrumbs.push(showSchemas)
  }

  private async getGoBackProjectMenu() {
    CliUx.ux.info(this.getStatus())

    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.GO_BACK_PROJECT_MENU))
    switch (nextStep) {
      case backToProjectMenu:
        await this.getProjectmenu()
        break
      case backToMainMenu:
        await this.getMainmenu()
        break
      default:
        process.exit(0)
    }
  }

  private async showDetailedSchemaMenu() {
    CliUx.ux.info(this.getStatus())

    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.SHOW_DETAILED_SCHEMA_MENU))
    switch (nextStep) {
      case chooseSchmeaFromList:
        await this.listSchemas()
        this.breadcrumbs.push(showDetailedSchema)
        await this.getGoBackSchemaMenu()
        break
      case typeSchemaId:
        await ShowSchema.run([`${await schemaId()}`])
        this.breadcrumbs.push(showDetailedSchema)
        await this.getGoBackSchemaMenu()
        break
      default:
        process.exit(0)
    }
  }

  private async getGoBackSchemaMenu() {
    CliUx.ux.info(this.getStatus())

    const nextStep = await selectNextStep(wizardMap.get(WizardMenus.GO_BACK_SCHEMA_MENU))
    switch (nextStep) {
      case backtoSchemaMenu:
        await this.getSchemamenu()
        break
      case backToMainMenu:
        await this.getMainmenu()
        break
      default:
        process.exit(0)
        break
    }
  }

  private async createProject() {
    const {
      account: { label: userEmail },
    } = getSession()
    CliUx.ux.info(
      wizardStatusMessage(
        wizardStatus({
          messages: defaultWizardMessages,
          breadcrumbs: this.breadcrumbs,
          userEmail,
        }),
      ),
    )
    await CreateProject.run(['-o', 'plaintext'])
    this.breadcrumbs.push('create a project')
  }

  private async useProject() {
    CliUx.ux.info(this.getStatus())
    await UseProject.run(['-o', 'plaintext'])
  }

  private async showProject(active: boolean) {
    CliUx.ux.info(this.getStatus())
    if (active) {
      await ShowProject.run(['-a', '-o', 'plaintext'])
      return
    }
    await ShowProject.run(['-o', 'plaintext'])
  }

  private async logout(nextStep: string) {
    await Logout.run(['-o', 'plaintext'])
    this.breadcrumbs.push(nextStep)
  }

  private getStatus(): string {
    const {
      account: { label: userEmail },
    } = getSession()
    const {
      project: { projectId },
    } = vaultService.getActiveProject()
    const status = wizardStatusMessage(
      wizardStatus({
        messages: defaultWizardMessages,
        breadcrumbs: this.breadcrumbs,
        userEmail,
        projectId,
      }),
    )
    return `\n${status}\n`
  }
}
