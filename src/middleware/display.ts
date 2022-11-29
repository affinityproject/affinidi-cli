import { CliUx } from '@oclif/core'
// import { configService } from './services/config'

const jsonToPlainText = (jsonObject: any, result: string[]): string => {
  if (typeof jsonObject === 'string') {
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
    if (typeof jsonObject[key] === 'string') {
      const newResult = result
      newResult.push(`${key} : ${jsonObject[key]}`)
      return jsonToPlainText(jsonObject[key], newResult)
    }
    return result.join('\n')
  })
  return result.join('\n')
}
export const displayOutput = (itemToDisplay: string, userId: string) => {
  const jsonObject = JSON.parse(itemToDisplay)
  const outputFormat = userId
  let formatedOutput = itemToDisplay
  if (outputFormat === 'plainText') {
    formatedOutput = jsonToPlainText(jsonObject, [])
  }
  CliUx.ux.info(formatedOutput)
}
