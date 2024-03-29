import { BasicDataWrapper } from '@celo/identity/lib/offchain-data-wrapper'
import { PrivateNameAccessor, PublicNameAccessor } from '@celo/identity/lib/offchain/accessors/name'
import {Flags as flags } from '@oclif/core'
import { BaseCommand } from '../../base'
import { Args, Flags } from '../../utils/command'
import { OffchainDataCommand } from '../../utils/off-chain-data'

export default class OffchainRead extends BaseCommand {
  static description = 'DEV: Reads the name from offchain storage'

  static flags = {
    ...OffchainDataCommand.flags,

    // private accessor parameters
    from: Flags.address({ required: false }),
    privateDEK: flags.string({ required: false }),
  }

  static args = [Args.address('address')]

  static examples = ['offchain-read 0x...', 'offchain-read 0x... --from 0x... --privateKey 0x...']

  async run() {
    const {
      args: { address },
      flags: { from, privateDEK },
    } = await this.parse(OffchainRead)
    const kit = await this.getKit()

    const provider = new BasicDataWrapper(from!, kit)

    if (privateDEK) {
      kit.addAccount(privateDEK)
    }

    const nameApplication = privateDEK
      ? new PrivateNameAccessor(provider)
      : new PublicNameAccessor(provider)
    const data = await nameApplication.read(address)
    console.log(data)
  }
}
