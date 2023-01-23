import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description =
    'Prints the list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eligible to elect validators.'

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  static examples = ['list']

  async run() {
    const res = await this.parse(List)
    const kit = await this.getKit()
    CliUx.ux.action.start('Fetching validator group vote totals')
    const election = await kit.contracts.getElection()
    const groupVotes = await election.getValidatorGroupsVotes()
    CliUx.ux.action.stop()
    CliUx.ux.table(
      groupVotes,
      {
        address: {},
        name: {},
        votes: { get: (g: any) => g.votes.toFixed() },
        capacity: { get: (g: any) => g.capacity.toFixed() },
        eligible: {},
      },
      res.flags
    )
  }
}
