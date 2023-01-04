/* eslint-disable import/no-cycle */
import { CliUx } from '@oclif/core'

import { schemaPublicPrivate, selectNextStep } from '../user-actions/inquirer'
import Start, { getStatus, logout as logoutF } from '../commands/start'
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
import { getGoBackSchemaMenu, showDetailedSchemaMenu } from './submenus'
import { getMainmenu } from './menus'

export const listSchemas = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  await ListSchemas.run(['-w'])
  Start.breadcrumbs.push(showSchemas)
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
  Start.breadcrumbs.push(createSchema)
}

export const getSchemamenu = async (): Promise<void> => {
  CliUx.ux.info(getStatus())
  const nextStep = await selectNextStep(wizardMap.get(WizardMenus.SCHEMA_MENU))
  switch (nextStep) {
    case showSchemas:
      await listSchemas()
      Start.breadcrumbs.push(showDetailedSchema)
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
      await getMainmenu()
      break
    case logout:
      logoutF(nextStep)
      break
    default:
      process.exit(0)
  }
}
