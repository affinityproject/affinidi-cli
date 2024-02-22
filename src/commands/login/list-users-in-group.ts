import { confirm, select } from '@inquirer/prompts'
import { ux, Flags } from '@oclif/core'
import z from 'zod'
import { BaseCommand } from '../../common'
import { promptRequiredParameters } from '../../common/prompts'
import { INPUT_LIMIT } from '../../common/validators'
import { vpAdapterService } from '../../services/affinidi/vp-adapter'
import { GroupUserMappingsList } from '../../services/affinidi/vp-adapter/vp-adapter.api'

const NEXT = 'Next'
const PREVIOUS = 'Previous'
const EXIT = 'Exit'
export const PAGE_SIZE_DEFAULT = 15

export class ListUsersInGroup extends BaseCommand<typeof ListUsersInGroup> {
  static summary = 'Use this command to list users in the user group'
  static examples = ['<%= config.bin %> <%= command.id %> --group-name my_group']
  static flags = {
    'group-name': Flags.string({
      summary: 'Name of the user group',
    }),
    'page-size': Flags.integer({
      summary: "The total number of items to return in the command's output",
    }),
    'starting-token': Flags.string({
      summary: 'A token to specify where to start paginating',
    }),
  }
  static pageNumber = 1
  static lastEvalutatedKeys = ''
  static middleListPrompting = {
    firstPage: false,
    startingTokenProvided: false,
    firstStartingToken: '',
  }

  public async run(): Promise<GroupUserMappingsList> {
    const { flags } = await this.parse(ListUsersInGroup)
    const promptFlags = await promptRequiredParameters(['group-name'], flags)
    const schema = z.object({
      'group-name': z.string().max(INPUT_LIMIT),
      'page-size': z.number().positive().optional(),
      'starting-token': z.string().optional(),
    })
    const validatedFlags = schema.parse(promptFlags)
    const pageSize = validatedFlags['page-size'] ?? PAGE_SIZE_DEFAULT
    const startingToken = validatedFlags['starting-token'] ?? undefined

    ux.action.start('Fetching users in the user group')
    const listGroupUsersOutput = await vpAdapterService.listGroupUsers(validatedFlags['group-name'], {
      limit: pageSize,
      exclusiveStartKey: startingToken,
    })
    ux.action.stop('Fetched successfully!')

    const { lastEvaluatedKey, ...rest } = listGroupUsersOutput
    if (!this.jsonEnabled())
      this.logJson({
        ...rest,
        'starting-token': lastEvaluatedKey,
      })

    if ((lastEvaluatedKey || ListUsersInGroup.lastEvalutatedKeys) && !flags['no-input']) {
      if (
        startingToken &&
        ListUsersInGroup.pageNumber === 1 &&
        !ListUsersInGroup.middleListPrompting.firstPage &&
        !ListUsersInGroup.middleListPrompting.startingTokenProvided
      ) {
        ListUsersInGroup.middleListPrompting = {
          firstPage: true,
          startingTokenProvided: true,
          firstStartingToken: startingToken,
        }
      }
      let totalPages = ListUsersInGroup.middleListPrompting.startingTokenProvided
        ? 'Page information is not available'
        : listGroupUsersOutput.totalUserCount
        ? Math.ceil(listGroupUsersOutput.totalUserCount / pageSize).toString()
        : '1' || '1'
      totalPages = totalPages === '0' ? '1' : totalPages
      const choices = [{ value: NEXT }, { value: PREVIOUS }, { value: EXIT }]

      if (
        (ListUsersInGroup.pageNumber === 1 && !ListUsersInGroup.middleListPrompting.startingTokenProvided) ||
        ListUsersInGroup.middleListPrompting.firstPage
      ) {
        choices.splice(1, 1) // Remove PREVIOUS if on first page
      }
      if (!lastEvaluatedKey) choices.splice(0, 1) // Remove NEXT if no more pages

      const selectionMessage = ListUsersInGroup.middleListPrompting.startingTokenProvided
        ? totalPages
        : `Showing page ${ListUsersInGroup.pageNumber}/${totalPages}`

      let paginationChoice = await select({
        choices,
        message: selectionMessage,
      })

      let shouldExit = false
      while (paginationChoice === EXIT && !shouldExit) {
        shouldExit = await confirm({ message: 'Are you sure you want to exit pagination?' })
        if (!shouldExit) {
          paginationChoice = await select({
            choices,
            message: selectionMessage,
          })
        }
      }

      if (paginationChoice !== EXIT) {
        let startingTokenFlag: string[] = []
        const pageSizeFlag = pageSize ? [`--page-size=${pageSize}`] : []

        if (paginationChoice === NEXT && lastEvaluatedKey) {
          if (!ListUsersInGroup.middleListPrompting.startingTokenProvided) ListUsersInGroup.pageNumber++
          if (ListUsersInGroup.middleListPrompting.firstPage) ListUsersInGroup.middleListPrompting.firstPage = false
          ListUsersInGroup.lastEvalutatedKeys += lastEvaluatedKey + ','
          startingTokenFlag = [`--starting-token=${lastEvaluatedKey}`]
        } else if (paginationChoice === PREVIOUS) {
          if (!ListUsersInGroup.middleListPrompting.startingTokenProvided) ListUsersInGroup.pageNumber--
          const lastEvalKeysArray = ListUsersInGroup.lastEvalutatedKeys.split(',').slice(0, -2)
          const previuosStartingToken = lastEvalKeysArray.pop()
          if (ListUsersInGroup.middleListPrompting.firstStartingToken === previuosStartingToken) {
            ListUsersInGroup.middleListPrompting.firstPage = true
          }
          ListUsersInGroup.lastEvalutatedKeys = lastEvalKeysArray.length ? lastEvalKeysArray.join(',') : ''
          startingTokenFlag = previuosStartingToken ? [`--starting-token=${previuosStartingToken}`] : []
        }

        // Run command with updated flags
        await this.config.runCommand('login:list-users-in-group', [
          `--group-name=${validatedFlags['group-name']}`,
          ...startingTokenFlag,
          ...pageSizeFlag,
        ])
      }
    }
    ListUsersInGroup.pageNumber = 0
    return listGroupUsersOutput
  }
}
