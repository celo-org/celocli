import { valueToString } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { concurrentMap } from '@celo/utils/lib/async'
import { zip } from '@celo/utils/lib/collections'
import chalk from 'chalk'
import { CliUx } from '@oclif/core'
import { BaseCommand } from '../../base'

export default class List extends BaseCommand {
  static description = 'List live governance proposals (queued and ongoing)'

  static flags = {
    ...BaseCommand.flags,
    ...(CliUx.ux.table.flags() as object),
  }

  static examples = ['list']

  async run() {
    const res = await this.parse(List)
    const kit = await this.getKit()

    const governance = await kit.contracts.getGovernance()
    const queue = await governance.getQueue()
    const expiredQueueMap = await concurrentMap(5, queue, (upvoteRecord) =>
      governance.isQueuedProposalExpired(upvoteRecord.proposalID)
    )
    const unexpiredQueue = queue.filter((_, idx) => !expiredQueueMap[idx])
    const sortedQueue: any = governance.sortedQueue(unexpiredQueue)

    console.log(chalk.magenta.bold('Queued Proposals:'))
    CliUx.ux.table(
      sortedQueue,
      {
        ID: { get: (p: any) => valueToString(p.proposalID) },
        upvotes: { get: (p) => valueToString(p.upvotes) },
      },
      res.flags
    )

    const dequeue = await governance.getDequeue(true)
    const expiredDequeueMap = await concurrentMap(5, dequeue, governance.isDequeuedProposalExpired)
    const unexpiredDequeue = dequeue.filter((_, idx) => !expiredDequeueMap[idx])
    const stages = await concurrentMap(5, unexpiredDequeue, governance.getProposalStage)
    const proposals = zip((proposalID, stage) => ({ proposalID, stage }), unexpiredDequeue, stages)

    console.log(chalk.blue.bold('Dequeued Proposals:'))
    CliUx.ux.table(
      proposals,
      {
        ID: { get: (p) => valueToString(p.proposalID) },
        stage: {},
      },
      res.flags
    )

    console.log(chalk.red.bold('Expired Proposals:'))
    const expiredQueue: any = queue
      .filter((_, idx) => expiredQueueMap[idx])
      .map((_, idx) => queue[idx].proposalID)
    const expiredDequeue = dequeue
      .filter((_, idx) => expiredDequeueMap[idx])
      .map((_, idx) => dequeue[idx])
    CliUx.ux.table(
      expiredQueue.concat(expiredDequeue),
      {
        ID: { get: (id: any) => valueToString(id) },
      },
      res.flags
    )
  }
}
