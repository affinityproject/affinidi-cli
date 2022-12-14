import jwkToPem from 'jwk-to-pem'
import jsonwebtoken from 'jsonwebtoken'
import { CliError } from '../../errors'
import { Api as KmsAPI } from './kms.api'

export const KMS_URL = 'https://4vbg213wpj.execute-api.ap-southeast-1.amazonaws.com/prod'
const SERVICE = 'KMS'

/// ///////////////////// TEST CODE ///////////////////////
const jwkPair = {
} as const

const privateKey = jwkToPem(jwkPair, { private: true })
const payloadMock = {
  projectId: 'workshop-pj-id',
  region: 'ap-southeast-1',
  iss: 'https://iam.affinidi.io/authz',
  type: 'ProjectTokenAuth',
  resource: 'ari:identity-domain:ap-southeast-1:workshop-pj-id:seed',
}

const createTokenForSeedOperation = () => {
  return jsonwebtoken.sign(payloadMock, privateKey, {
    expiresIn: 3600,
    algorithm: 'RS256',
    keyid: 'default1',
  })
}
const createTokenForSpecificSeedOperation = (seedId: string) => {
  return jsonwebtoken.sign(
    {
      ...payloadMock,
      resource: `ari:identity-domain:ap-southeast-1:workshop-pj-id:seed/${seedId}`,
    },
    privateKey,
    { expiresIn: 3600, algorithm: 'RS256', keyid: 'default1' },
  )
}
const createTokenForSpecificKeyOperation = (keyId: string) => {
  return jsonwebtoken.sign(
    { ...payloadMock, resource: `ari:identity-domain:ap-southeast-1:workshop-pj-id:key/${keyId}` },
    privateKey,
    { expiresIn: 3600, algorithm: 'RS256', keyid: 'default1' },
  )
}
/// ///////////////////// END TEST CODE ///////////////////////

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

  public createSeed = async (token = createTokenForSeedOperation()): Promise<{ id?: string }> => {
    try {
      const result = await this.client.seeds.createSeed({
        headers: {
          Authorization: token,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })
      return result.data
    } catch (error: any) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public createKey = async (
    seedId: string,
    token = createTokenForSpecificSeedOperation(seedId),
  ): Promise<{ id?: string }> => {
    try {
      const result = await this.client.seeds.createKey(
        seedId,
        { derivationPath: "m/44'/60'/0'/1" },
        {
          headers: {
            Authorization: token,
            'content-type': 'application/json',
            Accept: 'application/json',
          },
        },
      )
      return result.data
    } catch (error: any) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public listSeed = async (token = createTokenForSeedOperation()) => {
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
    } catch (error: any) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public signJwt = async (
    keyId: string,
    jwtData: any,
    token = createTokenForSpecificKeyOperation(keyId),
  ) => {
    try {
      const result = await this.client.keys.signJwt(keyId, jwtData, {
        headers: {
          Authorization: token,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })
      return result.data
    } catch (error: any) {
      console.log(error)
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public signCredential = async (
    keyId: string,
    credData: { unsignedCredential: any },
    token = createTokenForSpecificKeyOperation(keyId),
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
    } catch (error: any) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }
}

const kmsService = new KmsService()

export { kmsService }
