import { CliUx } from '@oclif/core'

import { schemaPublicPrivate, selectNextStep } from '../user-actions/inquirer'
import { getStatus, logout as logoutF } from './generalFunctions'
import {
  backToMainMenu,
  createSchema,
  logout,
  showDetailedSchema,
  showSchemas,
  wizardMap,
  WizardMenus,
} from '../constants'
import ListSchemas from '../commands/list/schemas'
import CreateSchema from '../commands/create/schema'
import { schemaDescription, schemaJSONFilePath } from '../user-actions'
import { wizardBreadcrumbs } from './attributes'
import { getGoBackSchemaMenu, showDetailedSchemaMenu } from './submenus'

export const listSchemas = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  await ListSchemas.run(['-w'])
  wizardBreadcrumbs.push(showSchemas)
}

export const createSchemaF = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  await CreateSchema.run([
    '-s',
    `${await schemaJSONFilePath()}`,
    `-p`,
    `${await schemaPublicPrivate()}`,
    '-d',
    `${await schemaDescription()}`,
  ])
  wizardBreadcrumbs.push(createSchema)
}

export const getSchemaMenu = async (goToMainMenu: () => Promise<void>): Promise<void> => {
  CliUx.ux.info(getStatus())
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.SCHEMA_MENU))
  switch (nextStep) {
    case showSchemas:
      await listSchemas()
      wizardBreadcrumbs.push(showDetailedSchema)
      await getGoBackSchemaMenu()
      break
    case showDetailedSchema:
      await showDetailedSchemaMenu()
      break
    case createSchema:
      await createSchemaF()
      await getGoBackSchemaMenu()
      break
    case backToMainMenu:
      await goToMainMenu()
      break
    case logout:
      logoutF(nextStep)
      break
    default:
      process.exit(0)
  }
}
