import { describe, it, expect, beforeEach } from 'vitest'
import {
  parseLotPurchaseAmountInput,
  parseLotQuantityInput,
  updateLotFields,
} from './updateLotAmount'
import { matrixToLots } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('parseLotPurchaseAmountInput', () => {
  it('parses non-negative amounts', () => {
    expect(parseLotPurchaseAmountInput('29.99')).toBe(29.99)
    expect(parseLotPurchaseAmountInput('  10,5 ')).toBe(10.5)
    expect(parseLotPurchaseAmountInput('0')).toBe(0)
    expect(parseLotPurchaseAmountInput(' 0.00 ')).toBe(0)
  })

  it('returns null for invalid', () => {
    expect(parseLotPurchaseAmountInput('')).toBeNull()
    expect(parseLotPurchaseAmountInput('-5')).toBeNull()
    expect(parseLotPurchaseAmountInput('x')).toBeNull()
  })
})

describe('parseLotQuantityInput', () => {
  it('parses positive quantities', () => {
    expect(parseLotQuantityInput('1000')).toBe(1000)
    expect(parseLotQuantityInput('  1,5 ')).toBe(1.5)
  })

  it('returns null for invalid', () => {
    expect(parseLotQuantityInput('')).toBeNull()
    expect(parseLotQuantityInput('0')).toBeNull()
    expect(parseLotQuantityInput('-1')).toBeNull()
  })
})

describe('updateLotFields', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('persists amount zero', async () => {
    resetAndSeedWorkbook({
      lots: matrixWithRows('lots', [
        {
          id: 'L1',
          inventory_id: 'INV1',
          transaction_id: 'T1',
          quantity: 10,
          amount: 5,
          created_at: '2025-01-01',
          archived: '',
          deleted: '',
        },
      ]),
    })

    await updateLotFields('s1', 'L1', { quantity: 10, amount: 0 })

    const lots = matrixToLots(useWorkbookStore.getState().tabs.lots)
    expect(lots[0]?.amount).toBe(0)
  })
})
