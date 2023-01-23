import { valueToFixidityString } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { Flags as flags } from '@oclif/core'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class SetPaymentDelegation extends BaseCommand {
  static description =
    "Sets a payment delegation beneficiary, an account address to receive a fraction of the validator's payment every epoch. The fraction must not be greater than 1."

  static flags = {
    ...BaseCommand.flags,
    account: Flags.address({ required: true }),
    beneficiary: Flags.address({ required: true }),
    fraction: flags.string({ required: true }),
  }

  static args = []

  static examples = [
    'set-payment-delegation --account 0x5409ed021d9299bf6814279a6a1411a7e866a631 --beneficiary 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb --fraction 0.1',
  ]

  async run() {
    const res = await this.parse(SetPaymentDelegation)
    const kit = await this.getKit()
    kit.defaultAccount = res.flags.account
    const accounts = await kit.contracts.getAccounts()

    await displaySendTx(
      'setPaymentDelegation',
      accounts.setPaymentDelegation(
        res.flags.beneficiary,
        valueToFixidityString(res.flags.fraction)
      )
    )
  }
}
