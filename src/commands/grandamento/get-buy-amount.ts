import { StableToken } from '@celo/contractkit'
import { toFixed } from '@celo/utils/lib/fixidity'
import { Flags as flags } from '@oclif/core'
import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'
import { enumEntriesDupWithLowercase } from '../../utils/helpers'

const stableTokenOptions = enumEntriesDupWithLowercase(Object.entries(StableToken))

export default class GetBuyAmount extends BaseCommand {
  static description = 'Gets the buy amount for a prospective Granda Mento exchange'

  static flags = {
    ...BaseCommand.flags,
    value: Flags.wei({
      required: true,
      description: 'The value of the tokens to exchange',
    }),
    stableToken: flags.enum({
      required: true,
      options: Object.keys(stableTokenOptions),
      description: 'Name of the stable to receive or send',
      default: 'cUSD',
    }),
    sellCelo: flags.enum({
      options: ['true', 'false'],
      required: true,
      description: 'Sell or buy CELO',
    }),
  }

  async run() {
    const kit = await this.getKit()
    const grandaMento = await kit.contracts.getGrandaMento()

    const res = await this.parse(GetBuyAmount)
    const sellAmount = res.flags.value
    const stableToken = stableTokenOptions[res.flags.stableToken]
    const sellCelo = res.flags.sellCelo === 'true'

    const stableTokenAddress = await kit.celoTokens.getAddress(stableToken)
    const sortedOracles = await kit.contracts.getSortedOracles()
    const celoStableTokenOracleRate = (await sortedOracles.medianRate(stableTokenAddress)).rate

    const buyAmount = await grandaMento.getBuyAmount(
      toFixed(celoStableTokenOracleRate),
      sellAmount,
      sellCelo
    )

    printValueMap({
      buyAmount,
    })
  }
}
