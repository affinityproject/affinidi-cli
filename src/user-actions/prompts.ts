import { CliUx } from '@oclif/core'

import { conditionsAndPolicyMessage } from '../render/texts'

export const AnswerNo = 'n'
export const AnswerYes = 'y'

export const enterEmailPrompt = async (
  text: string = 'Enter your Affinidi email address',
): Promise<string> => {
  return CliUx.ux.prompt(text, { required: true })
}

export const enterOTPPrompt = async (): Promise<string> => {
  return CliUx.ux.prompt('Enter the confirmation code we emailed to you', { type: 'mask' })
}

export const confirmSignOut = async (): Promise<string> => {
  return CliUx.ux.prompt('Please confirm that you want to sign-out from Affinidi [y/n]', {
    default: 'y',
  })
}

export const acceptConditionsAndPolicy = async (): Promise<string> => {
  return CliUx.ux.prompt(conditionsAndPolicyMessage, {
    default: 'n',
  })
}

export const projectNamePrompt = async (
  text: string = 'Please enter a project name',
): Promise<string> => {
  return CliUx.ux.prompt(text, { required: true })
}

export const enterIssuanceEmailPrompt = async (
  text: string = 'Please enter email the verifiable credential is sent to',
): Promise<string> => {
  return CliUx.ux.prompt(text, { required: true })
}

export const enterSchemaName = async (
  text: string = 'Please enter a name for the schema to be created',
): Promise<string> => {
  return CliUx.ux.prompt(text, { required: true })
}

export const analyticsConsentPrompt = async (
  text: string = 'Help us make Affinidi CLI better! Do you accept to send anonymous usage data? [y/n]',
): Promise<boolean> => {
  const prompt = await CliUx.ux.prompt(text, { default: 'n' })
  return prompt.toLowerCase() === 'y'
}
export const pathToVc = async (text: string = 'Path to JSON file'): Promise<string> => {
  const prompt = await CliUx.ux.prompt(text, { required: true })
  return prompt
}
export const applicationName = async (text: string = 'name of application'): Promise<string> => {
  const prompt = await CliUx.ux.prompt(text, { required: true })
  return prompt
}

export const schemaId = async (text: string = 'schema ID'): Promise<string> => {
  const prompt = await CliUx.ux.prompt(text, { required: true })
  return prompt
}

export const schemaJSONFilePath = async (text: string = 'path to JSON file'): Promise<string> => {
  const prompt = await CliUx.ux.prompt(text, { required: true })
  return prompt
}

export const schemaDescription = async (
  text: string = 'give a short description for the schema',
): Promise<string> => {
  const prompt = await CliUx.ux.prompt(text, { required: true })
  return prompt
}

export const schemaPublicPrivate = async (
  text: string = 'schema is public or unlist [public | unlisted]',
): Promise<boolean> => {
  const prompt = await CliUx.ux.prompt(text, { default: 'unlisted' })
  return prompt.toLowerCase() === 'public'
}

export const withProxy = async (
  text: string = 'create backend to hide credentials [y/n]',
): Promise<boolean> => {
  const prompt = await CliUx.ux.prompt(text, { default: 'n' })
  return prompt.toLowerCase() === 'y'
}
