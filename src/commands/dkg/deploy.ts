import { Flags as flags } from '@oclif/core'
import {AbiItem} from "web3-utils";
import { BaseCommand } from '../../base'
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'

import DKG from "./DKG.json"

export default class DKGDeploy extends BaseCommand {
  static description = 'Deploys the DKG smart contract'

  static flags = {
    ...BaseCommand.flags,
    phaseDuration: flags.integer({
      required: true,
      description: 'Duration of each DKG phase in blocks',
    }),
    threshold: flags.integer({ required: true, description: 'The threshold to use for the DKG' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = await this.parse(DKGDeploy)
    const kit = await this.getKit()
    const web3 = kit.connection.web3
    const dkg = new web3.eth.Contract(DKG.abi as unknown as AbiItem[])

    await displayWeb3Tx(
      'deployDKG',
      dkg.deploy({ data: DKG.bytecode, arguments: [res.flags.threshold, res.flags.phaseDuration] }),
      { from: res.flags.from }
    )
  }
}
