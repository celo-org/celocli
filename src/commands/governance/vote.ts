import { VoteValue } from '@celo/contractkit/lib/wrappers/Governance'
import { Flags as flags } from '@oclif/core'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Vote extends BaseCommand {
  static description = 'Vote on an approved governance proposal'

  static voteOptions = ['Abstain', 'No', 'Yes']

  static flags = {
    ...BaseCommand.flags,
    proposalID: flags.string({ required: true, description: 'UUID of proposal to vote on' }),
    value: flags.enum({ options: Vote.voteOptions, required: true, description: 'Vote' }),
    from: Flags.address({ required: true, description: "Voter's address" }),
  }

  static examples = [
    'vote --proposalID 99 --value Yes --from 0x5409ed021d9299bf6814279a6a1411a7e866a631',
  ]

  async run() {
    const res = await this.parse(Vote)
    const kit = await this.getKit()
    const signer = res.flags.from
    const id = res.flags.proposalID
    const voteValue = res.flags.value as keyof typeof VoteValue

    kit.defaultAccount = signer
    const governance = await kit.contracts.getGovernance()
    governance

    await newCheckBuilder(this, signer)
      .isVoteSignerOrAccount()
      .proposalExists(id)
      .proposalInStage(id, 'Referendum')
      .runChecks()

    await displaySendTx('voteTx', await governance.vote(id, voteValue), {}, 'ProposalVoted')
  }
}
