import { ensureLeading0x } from "@celo/utils/lib/address";
import { Flags as flags } from "@oclif/core";
import fs from "fs";
import { AbiItem } from "web3-utils";
import { BaseCommand } from "../../base";
import { displayWeb3Tx } from "../../utils/cli";
import { Flags } from "../../utils/command";

import DKG from './DKG.json'

export default class DKGPublish extends BaseCommand {
  static description = 'Publishes data for each phase of the DKG'

  static flags = {
    ...BaseCommand.flags,
    data: flags.string({ required: true, description: 'Path to the data being published' }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = await this.parse(DKGPublish)
    const kit = await this.getKit()
    const web3 = kit.connection.web3

    const dkg = new web3.eth.Contract(DKG.abi as unknown as AbiItem[], res.flags.address)

    const data = fs.readFileSync(res.flags.data).toString('hex')
    await displayWeb3Tx('publishData', dkg.methods.publish(ensureLeading0x(data)), {
      from: res.flags.from,
    })
  }
}
