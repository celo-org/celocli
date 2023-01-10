import { Flags as flags } from '@oclif/core'
import { BaseCommand, gasOptions, nodeFlagOptions, gasCurrencyFlagOptions } from '../../base'
import { readConfig, writeConfig } from '../../utils/config'

export default class Set extends BaseCommand {
  static description = 'Configure running node information for propogating transactions to network'

  static flags = {
    ...BaseCommand.flags,
    node: flags.string({
      ...nodeFlagOptions,
      hidden: false,
    }),
    gasCurrency: flags.enum({
      ...gasCurrencyFlagOptions,
      hidden: false,
    }),
  }

  static examples = [
    'set --node ws://localhost:2500',
    'set --node <geth-location>/geth.ipc',
    'set --gasCurrency cUSD',
    'set --gasCurrency CELO',
  ]

  requireSynced = false

  async run() {
    const res = await this.parse(Set)
    const curr = readConfig(this.config.configDir)
    const node = res.flags.node ?? curr.node
    const gasCurrency = res.flags.gasCurrency
      ? (gasOptions as any)[res.flags.gasCurrency]
      : curr.gasCurrency
    writeConfig(this.config.configDir, {
      node,
      gasCurrency,
    })
  }
}
