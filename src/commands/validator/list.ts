import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'

export const validatorTable = {
  address: {},
  name: {},
  affiliation: {},
  score: { get: (v: any) => v.score.toFixed() },
  ecdsaPublicKey: {},
  blsPublicKey: {},
  signer: {},
}

export default class ValidatorList extends BaseCommand {
  static description =
    'List registered Validators, their name (if provided), affiliation, uptime score, and public keys used for validating.'

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  static examples = ['list']

  async run() {
    const res = await this.parse(ValidatorList)
    const kit = await this.getKit()

    CliUx.ux.action.start('Fetching Validators')
    const validators = await kit.contracts.getValidators()
    const validatorList: unknown = await validators.getRegisteredValidators()

    CliUx.ux.action.stop()
    CliUx.ux.table(validatorList as Record<string, unknown>[], validatorTable, res.flags)
  }
}
