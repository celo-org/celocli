import { AttestationServiceStatusState, AttestationServiceStatusResponse } from '@celo/contractkit/lib/wrappers/Attestations'
import { concurrentMap } from '@celo/utils/lib/async'
import chalk from 'chalk'
import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'

export default class AttestationServicesCurrent extends BaseCommand {
  static description =
    "Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol"

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  async run() {
    const kit = await this.getKit()
    const res = await this.parse(AttestationServicesCurrent)
    CliUx.ux.action.start('Fetching currently elected Validators')
    const election = await kit.contracts.getElection()
    const validators = await kit.contracts.getValidators()
    const attestations = await kit.contracts.getAttestations()
    const signers = await election.getCurrentValidatorSigners()
    const validatorList = await Promise.all(
      signers.map((addr) => validators.getValidatorFromSigner(addr))
    )
    const validatorInfo: any = await concurrentMap(
      5,
      validatorList,
      attestations.getAttestationServiceStatus.bind(attestations)
    )

    CliUx.ux.action.stop()
    CliUx.ux.table(
      validatorInfo.sort((a: AttestationServiceStatusResponse, b: AttestationServiceStatusResponse) => {
        if (a.affiliation === b.affiliation) {
          return 0
        } else if (a.affiliation === null) {
          return 1
        } else if (b.affiliation === null) {
          return -1
        }
        return a.affiliation.toLowerCase().localeCompare(b.affiliation.toLowerCase())
      }),
      {
        address: {},
        affiliation: {},
        name: {},
        state: {
          get: (r) => {
            switch (r.state) {
              case AttestationServiceStatusState.NoMetadataURL:
              case AttestationServiceStatusState.InvalidMetadata:
              case AttestationServiceStatusState.UnreachableAttestationService:
              case AttestationServiceStatusState.WrongAccount:
              case AttestationServiceStatusState.Unhealthy:
              case AttestationServiceStatusState.InvalidAttestationServiceURL:
                return chalk.red(r.state)
              case AttestationServiceStatusState.Valid:
                return chalk.green(r.state)
              case AttestationServiceStatusState.NoAttestationSigner:
                return r.state
              default:
                return chalk.yellow(r.state)
            }
          },
        },
        version: {},
        attestationServiceURL: {},
        smsProviders: {},
      },
      res.flags
    )
  }
}
