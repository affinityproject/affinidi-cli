import { copyFile, readFile, writeFile } from 'fs/promises'

export async function configureAppEnvironment(
  path: string,
  clientId: string,
  clientSecret: string,
  issuer: string,
  connectionName?: string,
) {
  console.log(`Path: ${path}`)
  const donEnv = `${path}/.env`
  const donEnvExample = `${path}/.env.example`

  // if (!pathExistsSync(donEnvExample)) {
  //   throw new Error(`Unable to locate file .env.example in provided directory: ${path}`)
  // }

  await copyFile(donEnvExample, donEnv)

  let envContent = await readFile(donEnv, 'utf-8')
  envContent = envContent.replace(/PROVIDER_CLIENT_ID=".*"/, `PROVIDER_CLIENT_ID="${clientId}"`)
  envContent = envContent.replace(/PROVIDER_CLIENT_SECRET=".*"/, `PROVIDER_CLIENT_SECRET="${clientSecret}"`)
  envContent = envContent.replace(/PROVIDER_ISSUER=".*"/, `PROVIDER_ISSUER="${issuer}"`)

  if (connectionName) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_SOCIAL_CONNECTOR_NAME=".*"/,
      `NEXT_PUBLIC_SOCIAL_CONNECTOR_NAME="${connectionName}"`,
    )
  }

  await writeFile(donEnv, envContent, 'utf-8')
}
