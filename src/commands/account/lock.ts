import { Arg } from '@oclif/core/lib/interfaces'
import { BaseCommand } from '../../base'
import { Args } from '../../utils/command'

export default class Lock extends BaseCommand {
  static description = 'Lock an account which was previously unlocked'

  static flags = {
    ...BaseCommand.flags,
  }

  static args: Arg[] = [Args.address('account', { description: 'Account address' })]

  static examples = ['lock 0x5409ed021d9299bf6814279a6a1411a7e866a631']

  requireSynced = false

  async run() {
    const res = await this.parse(Lock)
    if (res.flags.useLedger) {
      console.warn('Warning: account:lock not implemented for Ledger')
    }

    const web3 = await this.getWeb3()
    await web3.eth.personal.lockAccount(res.args.account)
  }
}
