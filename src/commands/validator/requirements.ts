import { BaseCommand } from '../../base'
import { printValueMap } from '../../utils/cli'

export default class ValidatorRequirements extends BaseCommand {
  static description =
    'List the Locked Gold requirements for registering a Validator. This consists of a value, which is the amount of CELO that needs to be locked in order to register, and a duration, which is the amount of time that CELO must stay locked following the deregistration of the Validator.'

  static flags = {
    ...BaseCommand.flags,
  }

  static examples = ['requirements']

  async run() {
    const kit = await this.getKit()
    const validators = await kit.contracts.getValidators()

    const requirements = await validators.getValidatorLockedGoldRequirements()

    printValueMap(requirements)
  }
}
