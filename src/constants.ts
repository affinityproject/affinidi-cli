export const version = 1
export const anonymous = 'anonymous'
export type ViewFormat = 'plaintext' | 'json'

export const exit = 'exit'
export const logout = 'logout'
export const backToMainMenu = 'go back to main menu'
export const manageProjects = 'manage projects'
export const manageSchemas = 'manage schemas'
export const generateApplication = 'generate an application'
export const issueVC = 'issue a vc'
export const verifyVC = 'verify a vc'
export const changeActiveProject = 'change active project'
export const createProject = 'create another project'
export const showActiveProject = 'show active project'
export const showDetailedProject = "show project's details"
export const showSchemas = 'show schemas'
export const showDetailedSchema = 'show schema details'
export const createSchema = 'create schema'
export const backToProjectMenu = 'go back to project managment'
export const backtoSchemaMenu = 'go back to schema managment'
export const chooseSchmeaFromList = 'choose schema from list'
export const typeSchemaId = 'type schema ID'

export enum WizardMenus {
  AUTH_MENU = 'authmenu',
  MAIN_MENU = 'mainmenu',
  PROJECT_MENU = 'projectmenu',
  SCHEMA_MENU = 'schemamenu',
  GO_BACK_PROJECT_MENU = 'gobackprojectmenu',
  GO_BACK_SCHEMA_MENU = 'gobackschemamenu',
  SHOW_DETAILED_SCHEMA_MENU = 'showdetailedschemamenu',
}

export const wizardMap = new Map<WizardMenus, string[]>([
  [WizardMenus.AUTH_MENU, ['login', 'sign-up', exit]],
  [
    WizardMenus.MAIN_MENU,
    [manageProjects, manageSchemas, generateApplication, issueVC, verifyVC, logout, exit],
  ],
  [
    WizardMenus.PROJECT_MENU,
    [
      changeActiveProject,
      createProject,
      showActiveProject,
      showDetailedProject,
      backToMainMenu,
      logout,
      exit,
    ],
  ],
  [
    WizardMenus.SCHEMA_MENU,
    [showSchemas, showDetailedSchema, createSchema, backToMainMenu, logout, exit],
  ],
  [WizardMenus.GO_BACK_PROJECT_MENU, [backToProjectMenu, backToMainMenu]],
  [WizardMenus.GO_BACK_SCHEMA_MENU, [backtoSchemaMenu, backToMainMenu]],
  [WizardMenus.SHOW_DETAILED_SCHEMA_MENU, [chooseSchmeaFromList, typeSchemaId]],
])
