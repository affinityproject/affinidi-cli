import Conf from 'conf'
import * as os from 'os'
import * as path from 'path'

type UserToken = {
  access_token: string
  expires_in: number
  id_token: string
  scope: string
  token_type: string
  expires_at: Date
}
type ProjectToken = {
  projectId: string
  projectAccessToken: string
  expiresIn: number
  scope: string
}

type CredsType = {
  userToken: UserToken
  projectToken: ProjectToken
}
interface NewCredSetterGetter {
  clear: () => void
  getUserToken: () => UserToken
  setUserToken: (token: UserToken) => void
  getProjectToken: () => ProjectToken
  setProjectToken: (token: ProjectToken) => void
}

class NewVaultService {
  private readonly store: NewCredSetterGetter

  constructor(storer: NewCredSetterGetter) {
    this.store = storer
  }

  public getUserToken = (): UserToken => {
    return this.store.getUserToken()
  }

  public getProjectToken = (): ProjectToken => {
    return this.store.getProjectToken()
  }

  public setUserToken = (token: UserToken): void => {
    this.store.setUserToken(token)
  }

  public setProjectToken = (token: unknown, projectId: string): void => {
    const project = JSON.parse(JSON.stringify(token))
    const projectToken: ProjectToken = {
      projectId,
      projectAccessToken: project.accessToken,
      expiresIn: project.expiresIn,
      scope: project.scope,
    }
    this.store.setProjectToken(projectToken)
  }

  public clear = (): void => {
    this.store.clear()
  }
}

const credentialConf = new Conf<CredsType>({
  cwd: path.join(os.homedir(), '.affinidi'),
  configName: 'oAuthCred',
})

const storer: NewCredSetterGetter = {
  clear: (): void => {
    credentialConf.clear()
  },
  getUserToken: (): UserToken => {
    return credentialConf.get('userToken')
  },
  setUserToken: (token: UserToken): void => {
    credentialConf.set('userToken', token)
  },
  getProjectToken: (): ProjectToken => {
    return credentialConf.get('projectToken')
  },
  setProjectToken: (token: ProjectToken): void => {
    credentialConf.set('projectToken', token)
  },
}

export const newVaultService = new NewVaultService(storer)
