import { ProposalBuilder, proposalToJSON, ProposalTransactionJSON } from '@celo/governance'
import { Flags as flags } from '@oclif/core'
import { readFileSync } from 'fs'
import { BaseCommand } from '../../base'
import { printValueMapRecursive } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { executeProposal } from '../../utils/governance'
export default class TestProposal extends BaseCommand {
  static description = 'Test a governance proposal'

  static hidden = true

  static flags = {
    ...BaseCommand.flags,
    jsonTransactions: flags.string({
      required: true,
      description: 'Path to json transactions',
    }),
    from: Flags.address({ required: true, description: "Proposer's address" }),
  }

  static examples = [
    'test-proposal --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --jsonTransactions proposal.json',
  ]

  async run() {
    const res = await this.parse(TestProposal)
    const kit = await this.getKit()
    const account = res.flags.from
    kit.defaultAccount = account

    const builder = new ProposalBuilder(kit)

    // BUILD FROM JSON
    const jsonString = readFileSync(res.flags.jsonTransactions).toString()
    const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)
    jsonTransactions.forEach((tx) => builder.addJsonTx(tx))

    const proposal = await builder.build()
    printValueMapRecursive(await proposalToJSON(kit, proposal))

    await executeProposal(proposal, kit, account)
  }
}
