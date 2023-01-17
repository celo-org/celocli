import { ContractKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { Claim, validateClaim } from '@celo/contractkit/lib/identity/claims/claim'
import {
  VALIDATABLE_CLAIM_TYPES,
  VERIFIABLE_CLAIM_TYPES,
} from '@celo/contractkit/lib/identity/claims/types'
import { verifyClaim } from '@celo/contractkit/lib/identity/claims/verify'
import { eqAddress } from '@celo/utils/lib/address'
import { concurrentMap } from '@celo/utils/lib/async'
import { NativeSigner } from '@celo/utils/lib/signatureUtils'
import { CliUx } from '@oclif/core';
import { toChecksumAddress } from 'ethereumjs-util'
import { writeFileSync } from 'fs'
import moment from 'moment'
import { BaseCommand } from '../base'
import { Args, Flags } from './command'

export abstract class ClaimCommand extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description:
        'Address of the account to set metadata for or an authorized signer for the address in the metadata',
    }),
  }
  static args = [Args.file('file', { description: 'Path of the metadata file' })]
  public requireSynced = false
  // We need this to properly parse flags for subclasses
  protected self = ClaimCommand

  protected async checkMetadataAddress(address: string, from: string) {
    if (eqAddress(address, from)) {
      return
    }
    const kit = await this.getKit()
    const accounts = await kit.contracts.getAccounts()
    const signers = await accounts.getCurrentSigners(address)
    if (!signers.some((a) => eqAddress(a, from))) {
      throw new Error(
        'Signing metadata with an address that is not the account or one of its signers'
      )
    }
  }

  protected readMetadata = async () => {
    const { args, flags } = await this.parse(this.self)
    const filePath = args.file
    try {
      CliUx.ux.action.start(`Read Metadata from ${filePath}`)
      const kit = await this.getKit()
      const data = await IdentityMetadataWrapper.fromFile(
        await kit.contracts.getAccounts(),
        filePath
      )
      await this.checkMetadataAddress(data.data.meta.address, flags.from)
      CliUx.ux.action.stop()
      return data
    } catch (error) {
      CliUx.ux.action.stop(`Error: ${error}`)
      throw error
    }
  }

  protected async getSigner() {
    const res = await this.parse(this.self)
    const address = toChecksumAddress(res.flags.from)
    const kit = await this.getKit()
    return NativeSigner(kit.connection.sign, address)
  }

  protected async addClaim(metadata: IdentityMetadataWrapper, claim: Claim): Promise<Claim> {
    try {
      CliUx.ux.action.start(`Add claim`)
      const addedClaim = await metadata.addClaim(claim, await this.getSigner())
      CliUx.ux.action.stop()
      return addedClaim
    } catch (error) {
      CliUx.ux.action.stop(`Error: ${error}`)
      throw error
    }
  }

  protected writeMetadata = async (metadata: IdentityMetadataWrapper) => {
    const { args } = await this.parse(this.self)
    const filePath = args.file

    try {
      CliUx.ux.action.start(`Write Metadata to ${filePath}`)
      writeFileSync(filePath, metadata.toString())
      CliUx.ux.action.stop()
    } catch (error) {
      CliUx.ux.action.stop(`Error: ${error}`)
      throw error
    }
  }
}

export const claimArgs = [Args.file('file', { description: 'Path of the metadata file' })]

export const displayMetadata = async (
  metadata: IdentityMetadataWrapper,
  kit: ContractKit,
  tableFlags: object = {}
) => {
  const data = await concurrentMap(5, metadata.claims, async (claim) => {
    const verifiable = VERIFIABLE_CLAIM_TYPES.includes(claim.type)
    const validatable = VALIDATABLE_CLAIM_TYPES.includes(claim.type)
    const status = verifiable
      ? await verifyClaim(kit, claim, metadata.data.meta.address)
      : validatable
      ? await validateClaim(kit, claim, metadata.data.meta.address)
      : 'N/A'
    let extra = ''
    switch (claim.type) {
      case ClaimTypes.ATTESTATION_SERVICE_URL:
        extra = `URL: ${claim.url}`
        break
      case ClaimTypes.DOMAIN:
        extra = `Domain: ${claim.domain}`
        break
      case ClaimTypes.KEYBASE:
        extra = `Username: ${claim.username}`
        break
      case ClaimTypes.NAME:
        extra = `Name: "${claim.name}"`
        break
      case ClaimTypes.STORAGE:
        extra = `URL: "${claim.address}"`
        break
      default:
        extra = JSON.stringify(claim)
        break
    }
    return {
      type: claim.type,
      extra,
      status: verifiable
        ? status
          ? `Could not verify: ${status}`
          : 'Verified!'
        : validatable
        ? status
          ? `Invalid: ${status}`
          : `Valid!`
        : 'N/A',
      createdAt: moment.unix(claim.timestamp).fromNow(),
    }
  })

  CliUx.ux.table(
    data,
    {
      type: { header: 'Type' },
      extra: { header: 'Value' },
      status: { header: 'Status' },
      createdAt: { header: 'Created At' },
    },
    tableFlags
  )
}

export const modifyMetadata = async (
  kit: ContractKit,
  filePath: string,
  operation: (metadata: IdentityMetadataWrapper) => Promise<void>
) => {
  const metadata = await IdentityMetadataWrapper.fromFile(
    await kit.contracts.getAccounts(),
    filePath
  )
  await operation(metadata)
  writeFileSync(filePath, metadata.toString())
}
