import { ensureLeading0x } from '@celo/utils/lib/address'
import { Flags as flags } from '@oclif/core'
import fs from 'fs'
import { BaseCommand } from '../../base'
import { AbiItem } from "web3-utils";
import { displayWeb3Tx } from '../../utils/cli'
import { Flags } from '../../utils/command'

import DKG from './DKG.json'

export default class DKGRegister extends BaseCommand {
  static description = 'Register a public key in the DKG'

  static flags = {
    ...BaseCommand.flags,
    blsKey: flags.string({ required: true }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
    from: Flags.address({ required: true, description: 'Address of the sender' }),
  }

  async run() {
    const res = await this.parse(DKGRegister)
    const kit = await this.getKit()
    const web3 = kit.connection.web3

    const dkg = new web3.eth.Contract(DKG.abi as unknown as AbiItem[], res.flags.address)

    // read the pubkey and publish it
    const blsKey = fs.readFileSync(res.flags.blsKey).toString('hex')
    await displayWeb3Tx('registerBlsKey', dkg.methods.register(ensureLeading0x(blsKey)), {
      from: res.flags.from,
    })
  }
}
