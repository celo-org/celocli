import { concurrentMap } from '@celo/base'
import { CeloContract } from '@celo/contractkit'
import { newICeloVersionedContract } from '@celo/contractkit/lib/generated/ICeloVersionedContract'
import { newProxy } from '@celo/contractkit/lib/generated/Proxy'
import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'

const UNVERSIONED_CONTRACTS = [
  CeloContract.Registry,
  CeloContract.FeeCurrencyWhitelist,
  CeloContract.Freezer,
  CeloContract.TransferWhitelist,
]
const UNPROXIED_CONTRACTS = [CeloContract.TransferWhitelist]

export default class Contracts extends BaseCommand {
  static description = 'Lists Celo core contracts and their addesses.'

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  async run() {
    const kit = await this.getKit()
    const res = await this.parse(Contracts)

    const addressMapping = await kit.registry.addressMapping()
    const contractInfo = await concurrentMap(
      4,
      Array.from(addressMapping.entries()),
      async ([contract, proxy]) => {
        // skip implementation check for unproxied contract
        const implementation = UNPROXIED_CONTRACTS.includes(contract)
          ? 'NONE'
          : await newProxy(kit.web3, proxy).methods._getImplementation().call()

        // skip version check for unversioned contracts
        let version: string
        if (UNVERSIONED_CONTRACTS.includes(contract)) {
          version = 'NONE'
        } else {
          const raw = await newICeloVersionedContract(kit.web3, implementation)
            .methods.getVersionNumber()
            .call()
          version = `${raw[0]}.${raw[1]}.${raw[2]}.${raw[3]}`
        }

        const balances = await kit.celoTokens.balancesOf(proxy)
        return {
          contract,
          proxy,
          implementation,
          version,
          balances,
        }
      }
    )

    const tokenBalanceColumns: any = {}
    await kit.celoTokens.forEachCeloToken(
      (token) =>
        (tokenBalanceColumns[token.symbol] = {
          header: token.symbol,
          get: (i: typeof contractInfo[number]) => {
            const balance = i.balances[token.symbol]!
            return balance.isZero() ? '0' : balance.toExponential(3)
          },
        })
    )

    CliUx.ux.table(
      contractInfo,
      {
        contract: { get: (i) => i.contract },
        proxy: { get: (i) => i.proxy },
        implementation: { get: (i) => i.implementation },
        version: {
          get: (i) => i.version,
        },
        ...tokenBalanceColumns,
      },
      { sort: 'contract', ...res.flags }
    )
  }
}
