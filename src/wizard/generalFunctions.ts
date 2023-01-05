import Logout from '../commands/logout'
import { wizardStatusMessage, defaultWizardMessages, wizardStatus } from '../render/functions'
import { getSession } from '../services/user-management'
import { vaultService } from '../services/vault/typedVaultService'
import { wizardBreadcrumbs } from './attributes'

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
      breadcrumbs: wizardBreadcrumbs,
      userEmail,
      projectId,
    }),
  )
  return `\n${status}\n`
}

export const logout = async (nextStep: string): Promise<void> => {
  await Logout.run(['-o', 'plaintext'])
  wizardBreadcrumbs.push(nextStep)
}
