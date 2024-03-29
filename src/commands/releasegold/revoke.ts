import { Flags as flags } from '@oclif/core'
import prompts from 'prompts'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { ReleaseGoldBaseCommand } from '../../utils/release-gold-base'

export default class Revoke extends ReleaseGoldBaseCommand {
  static description =
    'Revoke the given contract instance. Once revoked, any Locked Gold can be unlocked by the release owner. The beneficiary will then be able to withdraw any released Gold that had yet to be withdrawn, and the remainder can be transferred by the release owner to the refund address. Note that not all ReleaseGold instances are revokable.'

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
    yesreally: flags.boolean({ description: 'Override prompt to set liquidity (be careful!)' }),
  }

  static args = []

  static examples = ['revoke --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631']

  async run() {
    const kit = await this.getKit()
    const { flags } = await this.parse(Revoke)

    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    const isRevocable = await this.releaseGoldWrapper.isRevocable()

    await newCheckBuilder(this)
      .addCheck('Contract is not revoked', () => !isRevoked)
      .addCheck('Contract is revocable', () => isRevocable)
      .runChecks()

    if (!flags.yesreally) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message: 'Are you sure you want to revoke this contract? (y/n)',
      })

      if (!response.confirmation) {
        console.info('Aborting due to user response')
        process.exit(0)
      }
    }

    kit.defaultAccount = await this.releaseGoldWrapper.getReleaseOwner()
    await displaySendTx('revokeReleasing', this.releaseGoldWrapper.revokeReleasing())
  }
}
