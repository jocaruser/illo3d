import type { SheetRecord } from '@/Entity/SheetEntity'
import { Transaction } from '@/Entity/Transaction'
import { AbstractSheetRepository } from './AbstractSheetRepository'

export class TransactionRepository extends AbstractSheetRepository<Transaction> {
  protected readonly sheet = 'transactions' as const
  protected readonly auditEntityName = 'transaction' as const
  protected readonly idPrefix = 'T'

  protected hydrate(record: SheetRecord): Transaction {
    return Transaction.fromRecord(record)
  }

  findActiveIncomeByClient(clientId: string): Transaction[] {
    return this.findActive().filter(
      (transaction) => transaction.isIncome() && transaction.clientId === clientId,
    )
  }
}
