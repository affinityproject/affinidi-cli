import { CliUx } from '@oclif/core'

import ShowSchema from '../commands/show/schema'
import { schemaPublicPrivate, selectNextStep } from '../user-actions/inquirer'
import { getStatus, logout as logoutF } from './generalFunctions'
import {
  backToMainMenu,
  backtoSchemaMenu,
  chooseSchmeaFromList,
  createSchema,
  logout,
  showDetailedSchema,
  showSchemas,
  typeSchemaId,
  wizardMap,
  WizardMenus,
} from '../constants'
import ListSchemas from '../commands/list/schemas'
import CreateSchema from '../commands/create/schema'
import { schemaDescription, schemaId, schemaJSONFilePath } from '../user-actions'
import { wizardBreadcrumbs } from './attributes'
import { AsyncVoidFn } from './types'

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

export const showDetailedSchemaMenu = async (toSchema: AsyncVoidFn): Promise<void> => {
  const step = await selectNextStep(wizardMap.get(WizardMenus.SHOW_DETAILED_SCHEMA_MENU))
  switch (step) {
    case chooseSchmeaFromList:
      await listSchemas()
      await toSchema()
      break
    case typeSchemaId:
      await ShowSchema.run([`${await schemaId()}`])
      await toSchema()
      break
    default:
      process.exit(0)
  }
}

export const executeSchemaCommand = async (
  step: string,
  toMain: AsyncVoidFn,
  toSchema: AsyncVoidFn,
): Promise<void> => {
  switch (step) {
    case showSchemas:
      await listSchemas()
      wizardBreadcrumbs.push(showDetailedSchema)
      break
    case showDetailedSchema:
      await showDetailedSchemaMenu(toSchema)
      break
    case createSchema:
      await createSchemaF()
      break
    case backToMainMenu:
      await toMain()
      break
    case logout:
      logoutF(step)
      break
    default:
      process.exit(0)
  }

  await toSchema()
}

export const executeSchemaPostCommand = async (
  step: string,
  toMain: AsyncVoidFn,
  toSchema: AsyncVoidFn,
): Promise<void> => {
  switch (step) {
    case backtoSchemaMenu:
      await toSchema()
      break
    case backToMainMenu:
      await toMain()
      break
    default:
      process.exit(0)
  }
}
