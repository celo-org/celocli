import { BasicDataWrapper } from '@celo/identity/lib/offchain-data-wrapper'
import {
  AwsStorageWriter,
  GitStorageWriter,
  GoogleStorageWriter,
  LocalStorageWriter,
} from '@celo/identity/lib/offchain/storage-writers'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { Flags as flags } from '@oclif/core'
import { ParserOutput } from '@oclif/core/lib/interfaces'
import { BaseCommand } from '../base'
import { parsePath } from './command'

export enum StorageProviders {
  AWS = 'aws',
  GCP = 'gcp',
  git = 'git',
}

export abstract class OffchainDataCommand extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    directory: flags.string({
      parse: parsePath,
      default: '.',
      description: 'To which directory data should be written',
    }),
    provider: flags.enum({
      options: ['git', 'aws', 'gcp'],
      description: 'If the CLI should attempt to push to the cloud',
    }),
    bucket: flags.string({
      dependsOn: ['provider'],
      description: 'If using a GCP or AWS storage bucket this parameter is required',
    }),
  }

  offchainDataWrapper!: BasicDataWrapper

  async init() {
    await super.init()

    const {
      flags: { provider, directory, bucket, privateKey },
    }: ParserOutput<any, any> = await this.parse()

    const from = privateKeyToAddress(privateKey)
    const kit = await this.getKit()
    this.offchainDataWrapper = new BasicDataWrapper(from, kit)

    this.offchainDataWrapper.storageWriter =
      provider === StorageProviders.GCP
        ? new GoogleStorageWriter(directory, bucket)
        : provider === StorageProviders.AWS
        ? new AwsStorageWriter(directory, bucket)
        : provider === StorageProviders.git
        ? new GitStorageWriter(directory)
        : new LocalStorageWriter(directory)
  }
}
