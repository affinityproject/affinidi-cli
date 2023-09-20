import { CLIError } from '@oclif/core/lib/errors'
import { AxiosError } from 'axios'
import { StatusCodes } from 'http-status-codes'

const AuthTokenExpired = "Your session has expired. Please, run command 'affinidi start' and try again."

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const getCommonAPIErrorMessage = (response: any): string => {
  switch (response.status) {
    case StatusCodes.FORBIDDEN:
    case StatusCodes.UNAUTHORIZED:
      return "You are not authorized to perform this action\nPlease, make sure you are logged in and have an active project by running command 'affinidi start'"
    case StatusCodes.NOT_FOUND:
      return 'The resource you are trying to access was not found\nPlease, check the entered resource identifier'
    case StatusCodes.BAD_REQUEST:
      switch (response.data?.name) {
        case 'NotSupportedError':
          return 'Action not supported\nUse flag --help to get details about command usage'
        default: {
          let message = 'Invalid input parameters'
          message +=
            '\nPlease, check the validity of entered values. Use flag --help to get details about input parameters.'
          const issues = response.data.details
          if (issues && issues.length) {
            message += `\nIssues found:`
            issues.forEach((issue: { issue: string }) => {
              message += `\n- ${issue.issue}`
            })
          }
          return message
        }
      }
    case StatusCodes.CONFLICT:
      switch (response.data?.name) {
        case 'AlreadyExistsError':
          return 'The resource you are trying to create already exists\nPlease, make sure the resource identifier is unique'
        case 'QuotaExceededError':
          return 'You have exceeded your quota.\nIf you think this is a mistake please contact customer support'
        default:
          return 'Conflicting action with the current state of your resources'
      }
    default:
      return `Unexpected error occurred\nPlease, contact customer support to resolve this issue
        ${
          response.data.debugId || response.data.traceId
            ? `\nDetails: ${JSON.stringify({
                debugId: response.data.debugId,
                traceId: response.data.traceId,
              })}`
            : ''
        }`
  }
}

export function handleServiceError(
  error: unknown,
  serviceErrorMessageHandler?: (response: any) => string | null,
): never {
  if (error instanceof AxiosError && error.response) {
    const { name, details } = error.response.data

    const isJwtExpired =
      name && name === 'InvalidJwtTokenError' && details?.some((err: any) => err.issue === 'jwt-expired')

    if (isJwtExpired) {
      throw new Error(AuthTokenExpired)
    }

    if (error.response) {
      throw new CLIError(
        serviceErrorMessageHandler
          ? serviceErrorMessageHandler(error.response) ?? getCommonAPIErrorMessage(error.response)
          : getCommonAPIErrorMessage(error.response),
      )
    }
  }

  throw error
}
