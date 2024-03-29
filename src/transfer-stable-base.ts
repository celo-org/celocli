import { StableToken } from '@celo/contractkit'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { Flags as flags } from '@oclif/core'
import { ParserOutput } from '@oclif/core/lib/interfaces'
import BigNumber from 'bignumber.js'
import { BaseCommand } from './base'
import { newCheckBuilder } from './utils/checks'
import { displaySendTx, failWith } from './utils/cli'
import { Flags } from './utils/command'

export abstract class TransferStableBase extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({ required: true, description: 'Address of the sender' }),
    to: Flags.address({ required: true, description: 'Address of the receiver' }),
    value: flags.string({ required: true, description: 'Amount to transfer (in wei)' }),
    comment: flags.string({ description: 'Transfer comment' }),
  }

  protected _stableCurrency: StableToken | null = null

  async run() {
    const res: ParserOutput<any, any> = await this.parse()

    const from: string = res.flags.from
    const to: string = res.flags.to
    const value = new BigNumber(res.flags.value)
    const kit = await this.getKit()

    if (!this._stableCurrency) {
      throw new Error('Stable currency not set')
    }
    let stableToken: StableTokenWrapper
    try {
      stableToken = await kit.contracts.getStableToken(this._stableCurrency)
    } catch {
      failWith(`The ${this._stableCurrency} token was not deployed yet`)
    }
    await kit.updateGasPriceInConnectionLayer(stableToken.address)

    const tx = res.flags.comment
      ? stableToken.transferWithComment(to, value.toFixed(), res.flags.comment)
      : stableToken.transfer(to, value.toFixed())

    const check = await newCheckBuilder(this)
      .hasEnoughStable(from, value, this._stableCurrency)
    await check.addConditionalCheck(
        `Account can afford transfer and gas paid in ${this._stableCurrency}`,
        kit.connection.defaultFeeCurrency === stableToken.address,
        async () => {
          const gas = await tx.txo.estimateGas({ feeCurrency: stableToken.address })
          // TODO: replace with gasPrice rpc once supported by min client version
          const { gasPrice } = kit.connection.fillGasPrice({
            gasPrice: '0',
            feeCurrency: stableToken.address,
          })
          const gasValue = new BigNumber(gas).times(gasPrice as string)
          const balance = await stableToken.balanceOf(from)
          return balance.gte(value.plus(gasValue))
        },
        `Cannot afford transfer with ${this._stableCurrency} gasCurrency; try reducing value slightly or using gasCurrency=CELO`
      ).runChecks()

    await displaySendTx(res.flags.comment ? 'transferWithComment' : 'transfer', tx)
  }
}
