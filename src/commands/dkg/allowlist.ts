import { ensureLeading0x } from '@celo/utils/lib/address'
import { Flags as flags } from '@oclif/core'
import { AbiItem } from "web3-utils";
import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'

import DKG from "./DKG.json"

export default class DKGRegister extends BaseCommand {
  static description = 'Allowlist an address in the DKG'

  static flags = {
    ...BaseCommand.flags,
    participantAddress: flags.string({
      required: true,
      description: 'Address of the participant to allowlist',
    }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = await this.parse(DKGRegister)
    const kit = await this.getKit()
    const web3 = kit.connection.web3
    const dkg = new web3.eth.Contract(DKG.abi as unknown as AbiItem, res.flags.address)
    const participantAddress = res.flags.participantAddress
    await displayWeb3Tx('allowlist', dkg.methods.allowlist(ensureLeading0x(participantAddress)), {
      from: res.flags.from,
    })
  }
}
