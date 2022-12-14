const { generateApi } = require('swagger-typescript-api')
const path = require('path')

const USER_MANAGEMENT_URL = 'https://console-user-management.prod.affinity-project.org'
const SCHEMA_MANAGER_URL = 'https://affinidi-schema-manager.prod.affinity-project.org'
const IAM_URL = 'https://affinidi-iam.prod.affinity-project.org'
const ISSUANCE_URL = 'https://console-vc-issuance.prod.affinity-project.org'
const VERIFY_URL = 'https://affinity-verifier.prod.affinity-project.org'
const ANALYTICS_URL = 'https://analytics-stream.staging.affinity-project.org'

generateApi({
  name: 'kms.api.ts',
  output: path.resolve(process.cwd(), './src/services/kms'),
  url: 'http://localhost:3001',
  httpClientType: 'axios',
}).catch(console.error)

generateApi({
  name: 'analytics.api.ts',
  output: path.resolve(process.cwd(), './src/services/analytics'),
  url: `${ANALYTICS_URL}/api-json`,
  httpClientType: 'axios',
}).catch(console.error)

generateApi({
  name: 'schema-manager.api.ts',
  output: path.resolve(process.cwd(), './src/services/schema-manager'),
  url: `${SCHEMA_MANAGER_URL}/api/swagger`,
  httpClientType: 'axios',
}).catch(console.error)

generateApi({
  name: 'user-management.api.ts',
  output: path.resolve(process.cwd(), './src/services/user-management'),
  url: `${USER_MANAGEMENT_URL}/api/swagger`,
  httpClientType: 'axios',
}).catch(console.error)

generateApi({
  name: 'iam.api.ts',
  output: path.resolve(process.cwd(), './src/services/iam'),
  url: `${IAM_URL}/api/swagger`,
  httpClientType: 'axios',
}).catch(console.error)

generateApi({
  name: 'issuance.api.ts',
  output: path.resolve(process.cwd(), './src/services/issuance'),
  url: `${ISSUANCE_URL}/api/swagger`,
  httpClientType: 'axios',
}).catch(console.error)

generateApi({
  name: 'verifier.api.ts',
  output: path.resolve(process.cwd(), './src/services/verification'),
  url: `${VERIFY_URL}/api/swagger`,
  httpClientType: 'axios',
}).catch(console.error)
//
// generateApi({
//   name: 'iam.api.ts',
//   output: path.resolve(process.cwd(), './src/services/genesis/iam'),
//   url: 'http://localhost:3001',
//   httpClientType: 'axios',
// }).catch(console.error)
