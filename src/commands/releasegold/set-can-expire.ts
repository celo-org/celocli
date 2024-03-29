import { Flags as flags } from '@oclif/core'
import prompts from 'prompts'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { ReleaseGoldBaseCommand } from '../../utils/release-gold-base'

export default class SetCanExpire extends ReleaseGoldBaseCommand {
  static description = 'Set the canExpire flag for the given ReleaseGold contract'

  static expireOptions = ['true', 'false', 'True', 'False']

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
    value: flags.enum({
      options: SetCanExpire.expireOptions,
      required: true,
      description: 'canExpire value',
    }),
    yesreally: flags.boolean({
      description: 'Override prompt to set expiration flag (be careful!)',
    }),
  }

  static args = []

  static examples = [
    'set-can-expire --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --value true',
  ]

  async run() {
    const kit = await this.getKit()
    const { flags } = await this.parse(SetCanExpire)
    const canExpire = flags.value === 'true' || flags.value === 'True' ? true : false

    await newCheckBuilder(this)
      .addCheck('New expire value is different', async () => {
        const revocationInfo = await this.releaseGoldWrapper.getRevocationInfo()
        return revocationInfo.canExpire !== canExpire
      })
      .runChecks()

    if (!flags.yesreally) {
      const response = await prompts({
        type: 'confirm',
        name: 'confirmation',
        message: 'Are you sure you want to change the `canExpire` parameter? (y/n)',
      })

      if (!response.confirmation) {
        console.info('Aborting due to user response')
        process.exit(0)
      }
    }

    kit.defaultAccount = await this.releaseGoldWrapper.getBeneficiary()
    await displaySendTx('setCanExpire', this.releaseGoldWrapper.setCanExpire(canExpire))
  }
}
