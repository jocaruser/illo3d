import { describe, expect, it } from 'vitest'
import type { Lot, Transaction } from '@/types/money'
import {
  buildExpenseLotLinkMaps,
  getTransactionConceptLink,
} from '@/lib/money/transactionConceptLink'

const baseTx = (overrides: Partial<Transaction>): Transaction => ({
  id: 'x1',
  date: '2025-01-01',
  type: 'expense',
  amount: -10,
  category: 'other',
  concept: 'Test',
  ref_type: '',
  ref_id: '',
  ...overrides,
})

describe('buildExpenseLotLinkMaps', () => {
  it('skips archived and deleted lots', () => {
    const lots: Lot[] = [
      {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T1',
        quantity: 1,
        amount: 1,
        created_at: '',
        archived: 'true',
      },
      {
        id: 'L2',
        inventory_id: 'INV2',
        transaction_id: 'T2',
        quantity: 1,
        amount: 1,
        created_at: '',
        deleted: 'true',
      },
      {
        id: 'L3',
        inventory_id: 'INV3',
        transaction_id: 'T3',
        quantity: 1,
        amount: 1,
        created_at: '',
      },
    ]
    const { expenseTxnIdsWithLots, inventoryIdByExpenseTxnId } =
      buildExpenseLotLinkMaps(lots)
    expect(expenseTxnIdsWithLots.has('T1')).toBe(false)
    expect(expenseTxnIdsWithLots.has('T2')).toBe(false)
    expect(expenseTxnIdsWithLots.has('T3')).toBe(true)
    expect(inventoryIdByExpenseTxnId.get('T3')).toBe('INV3')
  })

  it('records first inventory id per transaction', () => {
    const lots: Lot[] = [
      {
        id: 'L1',
        inventory_id: 'INV1',
        transaction_id: 'T1',
        quantity: 1,
        amount: 1,
        created_at: '',
      },
      {
        id: 'L2',
        inventory_id: 'INV2',
        transaction_id: 'T1',
        quantity: 1,
        amount: 1,
        created_at: '',
      },
    ]
    const { inventoryIdByExpenseTxnId } = buildExpenseLotLinkMaps(lots)
    expect(inventoryIdByExpenseTxnId.get('T1')).toBe('INV1')
  })
})

describe('getTransactionConceptLink', () => {
  it('returns job link when ref_type job and ref_id set', () => {
    const tx = baseTx({
      id: 'inc1',
      type: 'income',
      ref_type: 'job',
      ref_id: 'J9',
      concept: 'Paid work',
    })
    const link = getTransactionConceptLink(tx, undefined, undefined)
    expect(link).toEqual({
      to: '/jobs/J9',
      testId: 'transaction-concept-job-link-inc1',
    })
  })

  it('returns inventory link with id when expense has lots map', () => {
    const tx = baseTx({ id: 'e1', concept: 'Filament' })
    const expenseIds = new Set(['e1'])
    const invByTxn = new Map([['e1', 'INV7']])
    const link = getTransactionConceptLink(tx, expenseIds, invByTxn)
    expect(link).toEqual({
      to: '/inventory/INV7',
      testId: 'transaction-concept-inventory-link-e1',
    })
  })

  it('returns /inventory when expense has lots but no resolved inventory id', () => {
    const tx = baseTx({ id: 'e2' })
    const expenseIds = new Set(['e2'])
    const link = getTransactionConceptLink(tx, expenseIds, new Map())
    expect(link).toEqual({
      to: '/inventory',
      testId: 'transaction-concept-inventory-link-e2',
    })
  })

  it('returns null for expense not in lot set', () => {
    const tx = baseTx({ id: 'e3' })
    expect(getTransactionConceptLink(tx, new Set(), new Map())).toBeNull()
  })

  it('returns null for income without job ref', () => {
    const tx = baseTx({ id: 'i1', type: 'income', concept: 'Misc' })
    expect(getTransactionConceptLink(tx, undefined, undefined)).toBeNull()
  })
})
