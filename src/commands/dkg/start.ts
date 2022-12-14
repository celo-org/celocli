import { AbiItem } from "web3-utils";
import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'

import DKG from './DKG.json'

export default class DKGStart extends BaseCommand {
  static description = 'Starts the DKG'

  static flags = {
    ...BaseCommand.flags,
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = this.parse(DKGStart)
    const web3 = this.kit.connection.web3

    const dkg = new web3.eth.Contract(DKG.abi as unknown as AbiItem[], res.flags.address)

    await displayWeb3Tx('start', dkg.methods.start(), { from: res.flags.from })
    this.log('DKG Started!')
  }
}
