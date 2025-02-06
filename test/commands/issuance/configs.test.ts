import { runCommand } from '@oclif/test'
import { expect } from 'chai'
import nock from 'nock'

import { config } from '../../../src/services/env-config.js'

const CWE_URL = `${config.bffHost}/cwe`
const CIS_URL = `${config.bffHost}/cis`

const credentialSchemasFilePath = 'test/helpers/credential-schemas.json'

const didKeyWallet = {
  did: 'did:key:zQ3shX8xuicHdQjm9PAAvffDJQYHuBBXhsE2f1LWk47JeaSeN',
  id: '3a9ed355447423940d9a20171ab3cfeb',
  ari: 'ari:identity:ap-southeast-1:940e8684-55b3-4d41-8e3d-cd329e9f22f2:wallet/3a9ed355447423940d9a20171ab3cfeb',
  name: 'Wallet',
  description: '',
  keys: [
    {
      id: 'dde674328e69806278c580f4e09ee41e-236a45f3b9c272c9',
      ari: 'ari:identity:ap-southeast-1:940e8684-55b3-4d41-8e3d-cd329e9f22f2:key/dde674328e69806278c580f4e09ee41e-236a45f3b9c272c9',
    },
  ],
}

const configuration = {
  id: '00763994-4ffe-44da-87b6-d4dfb5e73744',
  name: 'DevConfig',
  description: 'Lorem ipsum',
  issuerDid: 'did:key:zQ3shQ8yfiXj6puHvBBSEfRmavz6BxeGP7QYLujiQqE7wT7gJ',
  issuerWalletId: '3a9ed355447423940d9a20171ab3cfeb',
  credentialOfferDuration: 600,
  format: 'ldp_vc',
  issuerUri: 'https://6b003c11-d867-4627-9034-23011d3d6a4f.apse1.issuance.dev.affinidi.io',
  credentialSupported: [
    {
      credentialTypeId: 'SkillBadge',
      jsonLdContextUrl: 'https://schema.affinidi.io/TSkillBadgeV1R0.jsonld',
      jsonSchemaUrl: 'https://schema.affinidi.io/TSkillBadgeV1R0.json',
    },
  ],
  version: 1,
}

const configurationWithWebhook = { ...configuration, webhook: { enabled: true, endpoint: { url: 'https://hook.com' } } }
const configurationWithDisabledWebhook = {
  ...configuration,
  webhook: { enabled: false, endpoint: { url: 'https://hook.com' } },
}

describe('issuance: configs commands', function () {
  describe('issuance:create-config', () => {
    it('creates a configutation and outputs its info', async () => {
      nock(CIS_URL).post('/v1/configurations').reply(200, configuration)
      nock(CWE_URL)
        .get('/v1/wallets')
        .reply(200, { wallets: [didKeyWallet] })
      const { stdout } = await runCommand([
        'issuance:create-config',
        `--name=${configuration.name}`,
        `--description="${configuration.description}"`,
        `--wallet-id=${didKeyWallet.id}`,
        `--credential-offer-duration=${configuration.credentialOfferDuration}`,
        `--file=${credentialSchemasFilePath}`,
        '--no-input',
        '--json',
      ])
      const response = JSON.parse(stdout)
      expect(response).to.have.a.property('name')
      expect(response).to.have.a.property('description')
      expect(response).to.have.a.property('issuerDid')
      expect(response).to.have.a.property('issuerWalletId')
      expect(response).to.have.a.property('credentialOfferDuration')
      expect(response).to.have.a.property('format')
      expect(response).to.have.a.property('issuerUri')
      expect(response).to.have.a.property('credentialSupported')
      expect(response.credentialSupported[0]).to.have.a.property('credentialTypeId')
      expect(response.credentialSupported[0]).to.have.a.property('jsonLdContextUrl')
      expect(response.credentialSupported[0]).to.have.a.property('jsonSchemaUrl')
    })

    it('creates a configutation with a webhook and outputs its info', async () => {
      nock(CIS_URL).post('/v1/configurations').reply(200, configurationWithWebhook)
      nock(CWE_URL)
        .get('/v1/wallets')
        .reply(200, { wallets: [didKeyWallet] })
      const { stdout } = await runCommand([
        'issuance:create-config',
        `--name=${configurationWithWebhook.name}`,
        `--description="${configurationWithWebhook.description}"`,
        `--wallet-id=${didKeyWallet.id}`,
        `--credential-offer-duration=${configurationWithWebhook.credentialOfferDuration}`,
        `--file=${credentialSchemasFilePath}`,
        `--webhook-url=${configurationWithWebhook.webhook.endpoint.url}`,
        '--enable-webhook',
        '--no-input',
        '--json',
      ])
      const response = JSON.parse(stdout)
      expect(response.webhook).to.have.a.property('enabled')
      expect(response.webhook).to.have.a.property('endpoint')
      expect(response.webhook.enabled).to.equal(true)
      expect(response.webhook.endpoint).to.have.a.property('url')
      expect(response.webhook.endpoint.url).to.not.be.empty
    })

    it('creates a configutation with a webhook that is explicitly set to false and outputs its info', async () => {
      nock(CIS_URL).post('/v1/configurations').reply(200, configurationWithDisabledWebhook)
      nock(CWE_URL)
        .get('/v1/wallets')
        .reply(200, { wallets: [didKeyWallet] })
      const { stdout } = await runCommand([
        'issuance:create-config',
        `--name=${configurationWithDisabledWebhook.name}`,
        `--description="${configurationWithDisabledWebhook.description}"`,
        `--wallet-id=${didKeyWallet.id}`,
        `--credential-offer-duration=${configurationWithDisabledWebhook.credentialOfferDuration}`,
        `--file=${credentialSchemasFilePath}`,
        `--webhook-url=${configurationWithDisabledWebhook.webhook.endpoint.url}`,
        '--no-enable-webhook',
        '--no-input',
        '--json',
      ])
      const response = JSON.parse(stdout)
      expect(response.webhook).to.have.a.property('enabled')
      expect(response.webhook).to.have.a.property('endpoint')
      expect(response.webhook.enabled).to.equal(false)
      expect(response.webhook.endpoint).to.have.a.property('url')
      expect(response.webhook.endpoint.url).to.not.be.empty
    })
  })

  describe('issuance:get-config', () => {
    it('outputs configuration info based on id', async () => {
      nock(CIS_URL).get(`/v1/configurations/${configuration.id}`).reply(200, configuration)
      const { stdout } = await runCommand(['issuance:get-config', `--id=${configuration.id}`])
      const response = JSON.parse(stdout)
      expect(response).to.have.a.property('name')
      expect(response).to.have.a.property('description')
      expect(response).to.have.a.property('issuerDid')
      expect(response).to.have.a.property('issuerWalletId')
      expect(response).to.have.a.property('credentialOfferDuration')
      expect(response).to.have.a.property('format')
      expect(response).to.have.a.property('issuerUri')
      expect(response).to.have.a.property('credentialSupported')
      expect(response.credentialSupported[0]).to.have.a.property('credentialTypeId')
      expect(response.credentialSupported[0]).to.have.a.property('jsonLdContextUrl')
      expect(response.credentialSupported[0]).to.have.a.property('jsonSchemaUrl')
    })
  })

  describe('issuance:list-configs', () => {
    it('outputs the list of configurations', async () => {
      nock(CIS_URL)
        .get('/v1/configurations')
        .reply(200, {
          configurations: [configuration],
        })
      const { stdout } = await runCommand(['issuance:list-configs'])
      const { configurations: response } = JSON.parse(stdout)
      expect(response[0]).to.have.a.property('name')
      expect(response[0]).to.have.a.property('description')
      expect(response[0]).to.have.a.property('issuerDid')
      expect(response[0]).to.have.a.property('issuerWalletId')
      expect(response[0]).to.have.a.property('credentialOfferDuration')
      expect(response[0]).to.have.a.property('format')
      expect(response[0]).to.have.a.property('issuerUri')
      expect(response[0]).to.have.a.property('credentialSupported')
    })
  })

  describe('issuance:update-config', () => {
    it('updates config', async () => {
      nock(CIS_URL).put(`/v1/configurations/${configuration.id}`).reply(200, configuration)

      const { stdout } = await runCommand([
        'issuance:update-config',
        `--description="${configuration.description}"`,
        `--id=${configuration.id}`,
      ])
      const response = JSON.parse(stdout)
      expect(response).to.have.a.property('name')
      expect(response).to.have.a.property('description')
      expect(response).to.have.a.property('issuerDid')
      expect(response).to.have.a.property('issuerWalletId')
      expect(response).to.have.a.property('credentialOfferDuration')
      expect(response).to.have.a.property('format')
      expect(response).to.have.a.property('issuerUri')
      expect(response).to.have.a.property('credentialSupported')
      expect(response.credentialSupported[0]).to.have.a.property('credentialTypeId')
      expect(response.credentialSupported[0]).to.have.a.property('jsonLdContextUrl')
      expect(response.credentialSupported[0]).to.have.a.property('jsonSchemaUrl')
    })

    it('updates webhook for config', async () => {
      nock(CIS_URL).put(`/v1/configurations/${configurationWithWebhook.id}`).reply(200, configurationWithWebhook)

      const { stdout } = await runCommand([
        'issuance:update-config',
        `--description="${configurationWithWebhook.description}"`,
        `--id=${configurationWithWebhook.id}`,
        `--webhook-url=${configurationWithWebhook.webhook.endpoint.url}`,
        '--enable-webhook',
      ])
      const response = JSON.parse(stdout)
      expect(response).to.have.a.property('name')
      expect(response).to.have.a.property('description')
      expect(response).to.have.a.property('issuerDid')
      expect(response).to.have.a.property('issuerWalletId')
      expect(response).to.have.a.property('credentialOfferDuration')
      expect(response).to.have.a.property('format')
      expect(response).to.have.a.property('issuerUri')
      expect(response).to.have.a.property('credentialSupported')
      expect(response.credentialSupported[0]).to.have.a.property('credentialTypeId')
      expect(response.credentialSupported[0]).to.have.a.property('jsonLdContextUrl')
      expect(response.credentialSupported[0]).to.have.a.property('jsonSchemaUrl')
      expect(response.webhook).to.have.a.property('enabled')
      expect(response.webhook).to.have.a.property('endpoint')
      expect(response.webhook.enabled).to.equal(true)
    })
  })

  describe('issuance:delete-config', () => {
    it('deletes configuration', async () => {
      nock(CIS_URL).delete(`/v1/configurations/${configuration.id}`).reply(200)
      const { stdout } = await runCommand(['issuance:delete-config', `--id=${configuration.id}`])
      const response = JSON.parse(stdout)
      expect(response).to.have.a.property('id')
    })
  })
})
