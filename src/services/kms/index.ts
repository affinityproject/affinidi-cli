import { CliError } from '../../errors'
import { Api as KmsAPI } from './kms.api'

export const KMS_URL = 'https://g9g6a7p0oj.execute-api.ap-southeast-1.amazonaws.com/dev/kms'
const SERVICE = 'KMS'

class KmsService {
  constructor(
    private readonly client = new KmsAPI({
      baseURL: KMS_URL,
      withCredentials: true,
      headers: {
        'Accept-Encoding': 'application/json',
      },
    }),
  ) {}

  public createSeed = async (token: string): Promise<{ id?: string }> => {
    try {
      const { data } = await this.client.seeds.createSeed({
        headers: {
          Authorization: token,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })

      return data
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public createKey = async (token: string, seedId: string): Promise<{ id?: string }> => {
    try {
      const result = await this.client.seeds.createKey(
        seedId,
        // eslint-disable-next-line
        { derivationPath: "m/44'/60'/0'/1", seedId: 'no' } as any,
        {
          headers: {
            Authorization: token,
            'content-type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      return result.data
    } catch (error) {
      console.error(error)
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public listSeed = async (token: string) => {
    try {
      const result = await this.client.seeds.listSeed(
        {},
        {
          headers: {
            Authorization: token,
            'content-type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      return result.data
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  // eslint-disable-next-line
  public signJwt = async (token: string, keyId: string, jwtData: any) => {
    try {
      const result = await this.client.keys.signJwt(keyId, jwtData, {
        headers: {
          Authorization: token,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })
      return result.data
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public signCredential = async (
    token: string,
    keyId: string,
    // eslint-disable-next-line
    credData: { unsignedCredential: any },
  ) => {
    try {
      const result = await this.client.keys.signCredential(keyId, credData, {
        headers: {
          Authorization: token,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })
      return result.data
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }
}

const kmsService = new KmsService()

export { kmsService }
