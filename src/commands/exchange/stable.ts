import { StableToken } from '@celo/contractkit'
import { Flags as flags } from '@oclif/core'
import ExchangeStableBase from '../../exchange-stable-base'
import { enumEntriesDupWithLowercase } from '../../utils/helpers'

const stableTokenOptions = enumEntriesDupWithLowercase(Object.entries(StableToken))
export default class ExchangeStable extends ExchangeStableBase {
  static description = 'Exchange Stable Token for CELO via the stability mechanism'

  static flags = {
    ...ExchangeStableBase.flags,
    stableToken: flags.enum({
      options: Object.keys(stableTokenOptions),
      description: 'Name of the stable token to be transfered',
      required: true,
    }),
  }

  static examples = [
    'stable --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cStableTokenSymbol',
    'stable --value 10000000000000 --forAtLeast 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cStableTokenSymbol',
  ]

  async init() {
    const res = await this.parse(ExchangeStable)
    const stableName = res.flags.stableToken
    this._stableCurrency = stableTokenOptions[stableName]
    await super.init()
  }
}
