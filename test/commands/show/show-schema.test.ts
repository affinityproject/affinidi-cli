import { expect, FancyTypes, test } from '@oclif/test'
import { StatusCodes } from 'http-status-codes'

import { SCHEMA_MANAGER_URL } from '../../../src/services/schema-manager'
import { mockSchemaDtoOne, mockSchemaDtoUnlisted } from '../../../src/fixtures/mock-schemas'
import { ServiceDownError, Unauthorized } from '../../../src/errors'
import { ANALYTICS_URL } from '../../../src/services/analytics'
import * as authentication from '../../../src/middleware/authentication'
import { VAULT_KEYS, vaultService } from '../../../src/services'

const getSchemaOK = (id: string) => async (api: FancyTypes.NockScope) =>
  api.get(`/schemas/${id}`).reply(StatusCodes.OK, mockSchemaDtoOne)

describe('schema', () => {
  before(() => {
    vaultService.set(VAULT_KEYS.analyticsOptIn, 'true')
  })
  after(() => {
    vaultService.clear()
  })
  describe('Given a non authenticated user', () => {
    test
      .stdout()
      .command(['show schema', mockSchemaDtoUnlisted.id])
      .it('runs show schema and display the Unauthorized error message', (ctx) => {
        expect(ctx.stdout).to.contain(Unauthorized)
      })
  })
  describe('Given a FORBIDDEN response from the schema-manager-api', () => {
    test
      .nock(`${SCHEMA_MANAGER_URL}`, async (api: FancyTypes.NockScope) =>
        api.get(`/schemas/${mockSchemaDtoOne.id}`).reply(StatusCodes.INTERNAL_SERVER_ERROR),
      )
      .stdout()
      .stub(authentication, 'isAuthenticated', () => true)
      .command(['show schema', mockSchemaDtoOne.id])
      .it('runs show schema ServiceDown error message', (ctx) => {
        expect(ctx.stdout).to.contain(ServiceDownError)
      })
  })

  test
    .nock(`${SCHEMA_MANAGER_URL}`, getSchemaOK(mockSchemaDtoOne.id))
    .nock(`${ANALYTICS_URL}`, (api) => api.post('/api/events').reply(StatusCodes.CREATED))
    .stdout()
    .stub(authentication, 'isAuthenticated', () => true)
    .command(['show schema', mockSchemaDtoOne.id])
    .it('runs show schema and displays the detailed schema', (ctx) => {
      expect(() => JSON.parse(ctx.stdout)).not.to.throw()
      expect(JSON.parse(ctx.stdout)).to.include(mockSchemaDtoOne)
    })
  test
    .nock(`${SCHEMA_MANAGER_URL}`, getSchemaOK(mockSchemaDtoOne.id))
    .nock(`${ANALYTICS_URL}`, (api) => api.post('/api/events').reply(StatusCodes.CREATED))
    .stdout()
    .stub(authentication, 'isAuthenticated', () => true)
    .command(['show schema', mockSchemaDtoOne.id, '-s', 'json'])
    .it('runs show schema and displays the jsonSchemaUrl field', (ctx) => {
      expect(ctx.stdout).to.contain(mockSchemaDtoOne.jsonSchemaUrl)
    })
  test
    .nock(`${SCHEMA_MANAGER_URL}`, getSchemaOK(mockSchemaDtoOne.id))
    .nock(`${ANALYTICS_URL}`, (api) => api.post('/api/events').reply(StatusCodes.CREATED))
    .stdout()
    .stub(authentication, 'isAuthenticated', () => true)
    .command(['show schema', mockSchemaDtoOne.id, '-s', 'jsonld'])
    .it('runs show schema and displays the jsonLdContextUrl field', (ctx) => {
      expect(ctx.stdout).to.contain(mockSchemaDtoOne.jsonLdContextUrl)
    })
})
