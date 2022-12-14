/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

/**
 * DTO contains a result of the seed record creation
 */
export interface CreateSeedResultDto {
  id?: string
}

/**
 * DTO contains a result of the seed exporting
 */
export interface ExportSeedResultDto {
  mnemonic?: string
}

/**
 * DTO contains list of seed records
 */
export interface ListSeedResultDto {
  records?: {
    id?: string
    projectId?: string
  }[]
}

/**
 * DTO contains list of keys records
 */
export interface ListKeysResultDto {
  records?: {
    id?: string
    projectId?: string
    derivationPath?: string
  }[]
}

/**
 * DTO contains configuration to create a key from the seed
 */
export interface CreateKeysConfigInputDto {
  derivationPath: string
}

/**
 * DTO contains the seed entropy as mnemonic that is imported into the system
 */
export interface ImportSeedMnemonicInputDto {
  mnemonic?: string
}

/**
 * DTO contains the seed entropy as hex string that is imported into the system
 */
export interface ImportSeedRawInputDto {
  seedHex?: string
}

/**
 * DTO contains result of key config creation
 */
export interface CreateKeysConfigResultDto {
  id?: string
}

/**
 * DTO contains params to sign credential
 */
export interface SignCredentialInputDto {
  unsignedCredential: object
}

/**
 * DTO contains signed credential
 */
export interface SignCredentialResultDto {
  signedCredential: object
}

/**
 * DTO contains parts of JWT to be signed
 */
export interface SignJwtInputDto {
  header: object
  payload: object
}

/**
 * DTO contains signed jwt
 */
export interface SignJwtResultDto {
  jwt: string
}

/**
 * Detail of an error
 */
export interface ErrorDetail {
  message?: string
}

/**
 * Error object
 */
export interface Error {
  errorCode?: string
  errorMessage?: string
  message?: string
  name?: string
  debugId?: string
  details?: ErrorDetail[]
}

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from 'axios'

export type QueryParamsType = Record<string | number, any>

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, 'data' | 'params' | 'url' | 'responseType'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean
  /** request path */
  path: string
  /** content type of request body */
  type?: ContentType
  /** query params */
  query?: QueryParamsType
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType
  /** request body */
  body?: unknown
}

export type RequestParams = Omit<FullRequestParams, 'body' | 'method' | 'query' | 'path'>

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, 'data' | 'cancelToken'> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void
  secure?: boolean
  format?: ResponseType
}

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance
  private securityData: SecurityDataType | null = null
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker']
  private secure?: boolean
  private format?: ResponseType

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({ ...axiosConfig, baseURL: axiosConfig.baseURL || '/api/v1' })
    this.secure = secure
    this.format = format
    this.securityWorker = securityWorker
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data
  }

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method)

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[method.toLowerCase() as keyof HeadersDefaults]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    }
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === 'object' && formItem !== null) {
      return JSON.stringify(formItem)
    } else {
      return `${formItem}`
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key]
      const propertyContent: Iterable<any> = property instanceof Array ? property : [property]

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File
        formData.append(key, isFileType ? formItem : this.stringifyFormItem(formItem))
      }

      return formData
    }, new FormData())
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {}
    const requestParams = this.mergeRequestParams(params, secureParams)
    const responseFormat = format || this.format || undefined

    if (type === ContentType.FormData && body && body !== null && typeof body === 'object') {
      body = this.createFormData(body as Record<string, unknown>)
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { 'Content-Type': type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    })
  }
}

/**
 * @title Affinidi Key Management Service
 * @version 1.0.0
 * @baseUrl /api/v1
 * @contact Genesis Team <genesis@affinidi.com>
 *
 * Affinidi Key Management Service
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  seeds = {
    /**
     * No description
     *
     * @tags seed
     * @name CreateSeed
     * @request POST:/seeds
     * @secure
     */
    createSeed: (params: RequestParams = {}) =>
      this.request<CreateSeedResultDto, Error>({
        path: `/seeds`,
        method: 'POST',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags seed
     * @name ListSeed
     * @request GET:/seeds
     * @secure
     */
    listSeed: (
      query?: {
        status?: 'revoked' | 'active'
      },
      params: RequestParams = {},
    ) =>
      this.request<ListSeedResultDto, Error>({
        path: `/seeds`,
        method: 'GET',
        query: query,
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags key
     * @name CreateKey
     * @request POST:/seeds/{id}/keys
     * @secure
     */
    createKey: (id: string, data: CreateKeysConfigInputDto, params: RequestParams = {}) =>
      this.request<CreateKeysConfigResultDto, Error>({
        path: `/seeds/${id}/keys`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description revokes the seed, after that the keys derived from this seed cannot be used anymore. Revoked seed id will be listed in seed list with isRevoked=true flag
     *
     * @tags seed
     * @name RevokeSeed
     * @request PATCH:/seeds/{id}/revoke
     * @secure
     */
    revokeSeed: (id: string, params: RequestParams = {}) =>
      this.request<void, Error>({
        path: `/seeds/${id}/revoke`,
        method: 'PATCH',
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags seed
     * @name ImportSeed
     * @request POST:/seeds/import
     * @secure
     */
    importSeed: (
      data: ImportSeedMnemonicInputDto | ImportSeedRawInputDto,
      params: RequestParams = {},
    ) =>
      this.request<CreateSeedResultDto, Error>({
        path: `/seeds/import`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * @description Export seed as a mnemonic phrase (for seed 128bit / 256bit (default)). Returns the exported seed from the service
     *
     * @tags seed
     * @name ExportSeedAsMnemonic
     * @request POST:/seeds/{id}/export-mnemonic
     * @secure
     */
    exportSeedAsMnemonic: (id: string, params: RequestParams = {}) =>
      this.request<ExportSeedResultDto, Error>({
        path: `/seeds/${id}/export-mnemonic`,
        method: 'POST',
        secure: true,
        format: 'json',
        ...params,
      }),
  }
  keys = {
    /**
     * No description
     *
     * @tags key
     * @name ListKeys
     * @request GET:/keys
     * @secure
     */
    listKeys: (params: RequestParams = {}) =>
      this.request<ListKeysResultDto, Error>({
        path: `/keys`,
        method: 'GET',
        secure: true,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags key
     * @name SignCredential
     * @request POST:/keys/{id}/sign-credential
     * @secure
     */
    signCredential: (id: string, data: SignCredentialInputDto, params: RequestParams = {}) =>
      this.request<SignCredentialResultDto, Error>({
        path: `/keys/${id}/sign-credential`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags key
     * @name SignJwt
     * @request POST:/keys/{id}/sign-jwt
     * @secure
     */
    signJwt: (id: string, data: SignJwtInputDto, params: RequestParams = {}) =>
      this.request<SignJwtResultDto, Error>({
        path: `/keys/${id}/sign-jwt`,
        method: 'POST',
        body: data,
        secure: true,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),
  }
}
