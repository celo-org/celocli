import { Flags as flags } from '@oclif/core'
import {AbiItem} from "web3-utils";
import { BaseCommand } from '../../base'
import { Flags } from '../../utils/command'
import DKG from "./DKG.json"

export enum Method {
  shares = 'shares',
  responses = 'responses',
  justifications = 'justifications',
  participants = 'participants',
  phase = 'phase',
  group = 'group',
}

export default class DKGGet extends BaseCommand {
  static description = 'Gets data from the contract to run the next phase'

  static options = ['shares', 'responses', 'justifications', 'participants', 'phase', 'group']

  static flags = {
    ...BaseCommand.flags,
    method: flags.enum({
      options: DKGGet.options,
      required: true,
      description: 'Getter method to call',
    }),
    address: Flags.address({ required: true, description: 'DKG Contract Address' }),
  }

  async run() {
    const res = await this.parse(DKGGet)
    const kit = await this.getKit()
    const web3 = kit.connection.web3

    const dkg = new web3.eth.Contract(DKG.abi as unknown as AbiItem[], res.flags.address)

    const methodType = res.flags.method as keyof typeof Method
    switch (methodType) {
      case Method.shares: {
        const data = await dkg.methods.getShares().call()
        this.log(JSON.stringify(data))
        break
      }
      case Method.responses: {
        const data = await dkg.methods.getResponses().call()
        this.log(JSON.stringify(data))
        break
      }
      case Method.justifications: {
        const data = await dkg.methods.getJustifications().call()
        this.log(JSON.stringify(data))
        break
      }
      case Method.participants: {
        const data = await dkg.methods.getParticipants().call()
        this.log(JSON.stringify(data))
        break
      }
      case Method.phase: {
        const phase = await dkg.methods.inPhase().call()
        this.log(`In phase: ${phase}`)
        break
      }
      case Method.group: {
        const data = await dkg.methods.getBlsKeys().call()
        const group = { threshold: data[0], blsKeys: data[1] }
        this.log(JSON.stringify(group))
        break
      }
    }
  }
}
