import { describe, expect, it } from 'vitest'
import { EXPENSE_CATEGORIES, TRANSACTION_TYPES, Transaction } from '@/Entity/Transaction'

const record = {
  id: 'T1',
  date: '2026-01-15',
  type: 'income',
  amount: '120',
  category: 'job',
  concept: 'Job J1',
  ref_type: 'job',
  ref_id: 'J1',
  client_id: 'CL1',
  notes: 'n',
  archived: '',
  deleted: '',
}

describe('Transaction', () => {
  it('round-trips fromRecord/toRecord', () => {
    const transaction = Transaction.fromRecord(record)
    expect(transaction.type).toBe('income')
    expect(transaction.amount).toBe(120)
    expect(transaction.refType).toBe('job')
    expect(transaction.toRecord()).toEqual(record)
  })

  it('defaults type to expense and blanks unknown ref types', () => {
    const transaction = Transaction.fromRecord({ type: 'bogus', ref_type: 'invoice' })
    expect(transaction.type).toBe('expense')
    expect(transaction.refType).toBe('')
    expect(transaction.amount).toBeUndefined()
  })

  it('income/expense predicates', () => {
    const transaction = new Transaction()
    expect(transaction.isExpense()).toBe(true)
    expect(transaction.isIncome()).toBe(false)
    transaction.type = 'income'
    expect(transaction.isIncome()).toBe(true)
    expect(transaction.isExpense()).toBe(false)
  })

  it('exposes the canonical type and category unions', () => {
    expect(TRANSACTION_TYPES).toEqual(['income', 'expense'])
    expect(EXPENSE_CATEGORIES).toContain('filament')
    expect(EXPENSE_CATEGORIES).toContain('other')
  })
})
