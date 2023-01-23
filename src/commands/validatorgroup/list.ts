import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'

export default class ValidatorGroupList extends BaseCommand {
  static description =
    'List registered Validator Groups, their names (if provided), commission, and members.'

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  static examples = ['list']

  async run() {
    const kit = await this.getKit()
    const res = await this.parse(ValidatorGroupList)

    CliUx.ux.action.start('Fetching Validator Groups')
    const validators = await kit.contracts.getValidators()
    const vgroups = await validators.getRegisteredValidatorGroups()
    CliUx.ux.action.stop()

    CliUx.ux.table(
      vgroups,
      {
        address: {},
        name: {},
        commission: { get: (r: any) => r.commission.toFixed() },
        members: { get: (r) => r.members.length },
      },
      res.flags
    )
  }
}
