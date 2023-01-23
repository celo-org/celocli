import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import { Flags as flags, CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'
import { newCheckBuilder } from '../../utils/checks'
import { printValueMap } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class IdentifierQuery extends BaseCommand {
  static description =
    'Queries ODIS for the on-chain identifier and pepper corresponding to a given phone number.'

  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'The address from which to perform the query',
    }),
    phoneNumber: Flags.phoneNumber({
      required: true,
      description:
        'The phone number for which to query the identifier. Should be in e164 format with country code.',
    }),
    context: flags.string({
      required: false,
      description: 'mainnet (default), alfajores, or alfajoresstaging',
    }),
  }

  static examples = [
    'identifier --phoneNumber +14151231234 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --context alfajores',
  ]

  async run() {
    const kit = await this.getKit()
    const { flags } = await this.parse(IdentifierQuery)
    const { phoneNumber, from, context } = flags

    await newCheckBuilder(this).isValidAddress(flags.from).runChecks()

    CliUx.ux.action.start('Querying ODIS for identifier')

    const authSigner: AuthSigner = {
      authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
      contractKit: kit,
    }

    const res = await OdisUtils.PhoneNumberIdentifier.getPhoneNumberIdentifier(
      phoneNumber,
      from,
      authSigner,
      OdisUtils.Query.getServiceContext(context)
    )

    CliUx.ux.action.stop()

    printValueMap({
      identifier: res.phoneHash,
      pepper: res.pepper,
    })
  }
}
