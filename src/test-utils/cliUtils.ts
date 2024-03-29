import { LoadOptions } from '@oclif/core/lib/interfaces'
import { BaseCommand } from '../base'

export async function testLocally(
  command: typeof BaseCommand,
  argv: string[],
  config?: LoadOptions
) {
  const extendedArgv = [...argv, '--node', 'local']
  return command.run(extendedArgv, config)
}
