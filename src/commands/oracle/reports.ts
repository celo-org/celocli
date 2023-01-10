import { CeloContract } from '@celo/contractkit'
import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'
import { failWith } from '../../utils/cli'

export default class Reports extends BaseCommand {
  static description = 'List oracle reports for a given token'

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  static args = [
    {
      name: 'token',
      required: true,
      description: 'Token to list the reports for',
      default: CeloContract.StableToken,
    },
  ]

  static example = ['reports StableToken', 'reports', 'reports StableTokenEUR']

  async run() {
    const kit = await this.getKit()
    const res = await this.parse(Reports)
    const sortedOracles = await kit.contracts.getSortedOracles()

    const reports: any = await sortedOracles.getReports(res.args.token).catch((e) => failWith(e))
    CliUx.ux.table(
      reports,
      {
        address: {},
        rate: { get: (r: any) => r.rate.toNumber() },
        timestamp: { get: (r) => r.timestamp.toNumber() },
      },
      res.flags
    )
  }
}
