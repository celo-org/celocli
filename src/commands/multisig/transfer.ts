import { Flags as flags } from '@oclif/core'
import { BigNumber } from 'bignumber.js'
import { BaseCommand } from '../../base'
import { displaySendTx } from '../../utils/cli'
import { Args, Flags } from '../../utils/command'

export default class MultiSigTransfer extends BaseCommand {
  static description =
    'Ability to approve CELO transfers to and from multisig. Submit transaction or approve a matching existing transaction'

  static flags = {
    ...BaseCommand.flags,
    to: Flags.address({ required: true, description: 'Recipient of transfer' }),
    amount: flags.string({ required: true, description: 'Amount to transfer, e.g. 10e18' }),
    transferFrom: flags.boolean({
      description: 'Perform transferFrom instead of transfer in the ERC-20 interface',
    }),
    sender: Flags.address({ description: 'Identify sender if performing transferFrom' }),
    from: Flags.address({
      required: true,
      description: 'Account transferring value to the recipient',
    }),
  }

  static args = [Args.address('address')]

  static examples = [
    'transfer <multiSigAddr> --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --amount 200000e18 --from 0x123abc',
    'transfer <multiSigAddr> --transferFrom --sender 0x123abc --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --amount 200000e18 --from 0x123abc',
  ]

  async run() {
    const kit = await this.getKit()
    const {
      args,
      flags: { to, sender, from, amount, transferFrom },
    } = await this.parse(MultiSigTransfer)
    const amountBN = new BigNumber(amount)
    const celoToken = await kit.contracts.getGoldToken()
    const multisig = await kit.contracts.getMultiSig(args.address)

    let transferTx
    if (transferFrom) {
      if (!sender) this.error("Must submit 'sender' when submitting TransferFrom tx")
      transferTx = celoToken.transferFrom(sender, to, amountBN.toString())
    } else {
      transferTx = celoToken.transfer(to, amountBN.toString())
    }
    const multiSigTx = await multisig.submitOrConfirmTransaction(celoToken.address, transferTx.txo)
    await displaySendTx<any>('submitOrApproveTransfer', multiSigTx, { from }, 'tx Sent')
  }
}
