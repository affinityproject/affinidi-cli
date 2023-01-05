import { CliUx } from '@oclif/core'

import {
  backToMainMenu,
  backToProjectMenu,
  backtoSchemaMenu,
  chooseSchmeaFromList,
  showDetailedSchema,
  typeSchemaId,
  wizardMap,
  WizardMenus,
} from '../constants'
import { selectNextStep } from '../user-actions/inquirer'

import { getStatus } from './generalFunctions'
import { getSchemaMenu, listSchemas } from './shemaManagement'
import { getProjectmenu } from './projectManagement'
import ShowSchema from '../commands/show/schema'
import { schemaId } from '../user-actions'
import { getMainmenu } from './menus'
import { wizardBreadcrumbs } from './attributes'

export const getGoBackSchemaMenu = async (): Promise<void> => {
  CliUx.ux.info(getStatus())

  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.GO_BACK_SCHEMA_MENU))
  switch (nextStep) {
    case backtoSchemaMenu:
      await getSchemaMenu()
      break
    case backToMainMenu:
      await getMainmenu()
      break
    default:
      process.exit(0)
      break
  }
}
export const showDetailedSchemaMenu = async (): Promise<void> => {
  CliUx.ux.info(getStatus())

  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.SHOW_DETAILED_SCHEMA_MENU))
  switch (nextStep) {
    case chooseSchmeaFromList:
      await listSchemas()
      wizardBreadcrumbs.push(showDetailedSchema)
      await getGoBackSchemaMenu()
      break
    case typeSchemaId:
      await ShowSchema.run([`${await schemaId()}`])
      wizardBreadcrumbs.push(showDetailedSchema)
      await getGoBackSchemaMenu()
      break
    default:
      process.exit(0)
  }
}

export const getGoBackProjectMenu = async (): Promise<void> => {
  CliUx.ux.info(getStatus())

  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.GO_BACK_PROJECT_MENU))
  switch (nextStep) {
    case backToProjectMenu:
      await getProjectmenu()
      break
    case backToMainMenu:
      await getMainmenu()
      break
    default:
      process.exit(0)
  }
}
