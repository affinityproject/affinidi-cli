import { CliError } from '../../../errors'
import {
  CreateProjectInput,
  ProjectDto,
  Api as IamApi,
  CreateProjectScopedTokenOutput,
} from './iam.api'

export const GENESIS_IAM_URL = 'https://rdoibywdwi.execute-api.ap-southeast-1.amazonaws.com/prod'
const SERVICE = 'genesis-iam'

class GenesisIAMService {
  constructor(
    private readonly client = new IamApi({
      baseURL: GENESIS_IAM_URL,
      withCredentials: true,
      headers: {
        'Accept-Encoding': 'application/json',
      },
    }),
  ) {}

  public createProject = async (
    token: string,
    projectName: CreateProjectInput,
  ): Promise<ProjectDto> => {
    try {
      const result = await this.client.projects.createProject(projectName, {
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })
      return result.data
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public listProjects = async (
    token: string,
    skip: number,
    limit: number,
  ): Promise<Array<ProjectDto>> => {
    try {
      const {
        data: { projects },
      } = await this.client.projects.listProject({
        headers: {
          Authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          Accept: 'application/json',
        },
      })

      const projectsListSize = projects?.length
      if (!projects || skip > projectsListSize) {
        return []
      }

      return projects.slice(skip, skip + limit)
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }

  public createProjectScopedToken = async (
    token: string,
    projectId: string,
  ): Promise<CreateProjectScopedTokenOutput> => {
    try {
      const { data } = await this.client.createProjectScopedToken.createProjectScopedToken(
        { projectId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'content-type': 'application/json',
            Accept: 'application/json',
          },
        },
      )

      return data
    } catch (error) {
      throw new CliError(error?.message, error.response.status, SERVICE)
    }
  }
}

const genesisIAMService = new GenesisIAMService()

export { genesisIAMService }
