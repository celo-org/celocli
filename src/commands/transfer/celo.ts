import { Flags as flags } from '@oclif/core'
import BigNumber from 'bignumber.js'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class TransferCelo extends BaseCommand {
  static description =
    'Transfer CELO to a specified address. (Note: this is the equivalent of the old transfer:gold)'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    value: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
    comment: flags.string({ description: 'Transfer comment' }),
  }

  static examples = [
    'celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000',
  ]

  async run() {
    const kit = await this.getKit()
    const res = await this.parse(TransferCelo)

    const from: string = res.flags.from
    const to: string = res.flags.to
    const value = new BigNumber(res.flags.value)

    kit.defaultAccount = from
    const celoToken = await kit.contracts.getGoldToken()

    const check = await newCheckBuilder(this).hasEnoughCelo(from, value)
    await check.runChecks()

    if (res.flags.comment) {
      await displaySendTx(
        'transferWithComment',
        celoToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      )
    } else {
      await displaySendTx('transfer', celoToken.transfer(to, value.toFixed()))
    }
  }
}
