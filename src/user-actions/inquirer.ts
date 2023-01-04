import * as inquirer from 'inquirer'
import { SchemaDto } from '../services/schema-manager/schema-manager.api'
import { ProjectDto } from '../services/iam/iam.api'

export const selectProject = async (
  projectData: ProjectDto[],
  maxNameLength: number,
): Promise<string> => {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'projectId',
        message: 'select a project',
        choices: projectData.map((data) => ({
          name: `${data.projectId} ${data.name.padEnd(maxNameLength)} ${data.createdAt}`,
        })),
      },
    ])
    .then((answer) => {
      return answer.projectId.split(' ')[0]
    })
}

export const selectSchema = async (
  schemaData: SchemaDto[],
  maxIdLength: number,
): Promise<string> => {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'schemaId',
        message: 'select a schema',
        choices: schemaData.map((data) => ({
          name: `${data.id.padEnd(maxIdLength)} ${data.description} ${data.version} ${data.type}`,
          value: `${data.id}`,
        })),
      },
    ])
    .then((answer) => {
      return answer.schemaId
    })
}

export const schemaPublicPrivate = async (): Promise<boolean> => {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'Schema private or unlisted',
        message: 'Do you want your schema private or unlisted',
        choices: ['public', 'unlisted'],
      },
    ])
    .then((choice) => {
      return choice === 'public'
    })
}

export const selectNextStep = async (choices: string[]): Promise<string> => {
  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'NextStep',
        message: 'select your next step',
        choices,
      },
    ])
    .then((choice) => {
      return choice.NextStep
    })
}
