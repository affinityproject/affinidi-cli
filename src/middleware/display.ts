import { CliUx } from '@oclif/core'
import { configService } from '../services/config'

export const jsonToPlainText = (jsonObject: any, result: string[]): string => {
  if (typeof jsonObject !== 'object') {
    return result.join('\n')
  }
  Object.keys(jsonObject).forEach((key): string => {
    if (typeof jsonObject[key] === 'object') {
      const newResult = result
      if (Number.isNaN(Number(key))) {
        newResult.push(`\n${key} :`)
      } else {
        newResult.push(`\n${Number(key) + 1} :`)
      }
      return jsonToPlainText(jsonObject[key], newResult)
    }
    if (typeof jsonObject[key] !== 'object') {
      const newResult = result
      newResult.push(`${key} : ${jsonObject[key]}`)
      return jsonToPlainText(jsonObject[key], newResult)
    }
    return result.join('\n')
  })
  return result.join('\n')
}
export const displayOutput = (itemToDisplay: string, userId: string) => {
  let outputFormat: string
  try {
    outputFormat = configService.get('configs')[userId]?.outputFormat
  } catch (error) {
    outputFormat = outputFormat === undefined ? 'plaintext' : outputFormat
  }
  let formatedOutput = itemToDisplay
  const nullRegex = new RegExp('null', 'g')

  if (outputFormat === 'plaintext') {
    try {
      const nullRemoved = itemToDisplay.replace(nullRegex, '"null"')
      const jsonObject = JSON.parse(nullRemoved)
      formatedOutput = jsonToPlainText(jsonObject, [])
    } catch (error) {
      formatedOutput = itemToDisplay
    }
  }
  CliUx.ux.info(formatedOutput)
}
