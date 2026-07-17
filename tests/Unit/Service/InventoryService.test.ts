import { describe, expect, it } from 'vitest'
import { InventoryService } from '@/Service/InventoryService'
import { makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  context.tabs.seed('inventory', {
    id: 'INV1',
    type: 'filament',
    name: 'PLA',
    qty_current: '100',
  })
  context.tabs.seed('lots', {
    id: 'L1',
    inventory_id: 'INV1',
    transaction_id: 'T1',
    quantity: '10',
    amount: '5',
  })
  context.tabs.seed('transactions', { id: 'T1', type: 'expense', amount: '-5' })
  context.tabs.seed('transactions', { id: 'T2', type: 'income', amount: '9' })
  return { ...context, service: new InventoryService(context.em) }
}

describe('updateQtyCurrent', () => {
  it('rounds to 2 decimals and saves', () => {
    const { em, service } = makeService()
    const result = service.updateQtyCurrent('INV1', 12.345)
    expect(result.ok).toBe(true)
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(12.35)
  })

  it('accepts 0 and rejects negatives, NaN and unknown items', () => {
    const { service } = makeService()
    expect(service.updateQtyCurrent('INV1', 0).ok).toBe(true)
    expect(service.updateQtyCurrent('INV1', -1)).toEqual({
      ok: false,
      error: 'inventoryDetail.qtyInvalid',
    })
    expect(service.updateQtyCurrent('INV1', NaN)).toEqual({
      ok: false,
      error: 'inventoryDetail.qtyInvalid',
    })
    expect(service.updateQtyCurrent('INV9', 1)).toEqual({
      ok: false,
      error: 'inventoryDetail.notFound',
    })
  })
})

describe('updateThresholds', () => {
  it('saves the three tiers', () => {
    const { em, service } = makeService()
    const result = service.updateThresholds('INV1', { yellow: 500, orange: 250, red: 0 })
    expect(result.ok).toBe(true)
    const item = em.inventory.find('INV1')
    expect(item?.warnYellow).toBe(500)
    expect(item?.warnOrange).toBe(250)
    expect(item?.warnRed).toBe(0)
  })

  it('rejects negatives, non-integers and unknown items', () => {
    const { service } = makeService()
    expect(service.updateThresholds('INV1', { yellow: -1, orange: 0, red: 0 })).toEqual({
      ok: false,
      error: 'inventoryDetail.saveError',
    })
    expect(service.updateThresholds('INV1', { yellow: 0, orange: 1.5, red: 0 })).toEqual({
      ok: false,
      error: 'inventoryDetail.saveError',
    })
    expect(service.updateThresholds('INV1', { yellow: 0, orange: 0, red: NaN })).toEqual({
      ok: false,
      error: 'inventoryDetail.saveError',
    })
    expect(service.updateThresholds('INV9', { yellow: 0, orange: 0, red: 0 })).toEqual({
      ok: false,
      error: 'inventoryDetail.notFound',
    })
  })
})

describe('updateColour', () => {
  it('accepts #RRGGBB and empty string', () => {
    const { em, service } = makeService()
    expect(service.updateColour('INV1', '#A1b2C3').ok).toBe(true)
    expect(em.inventory.find('INV1')?.colour).toBe('#A1b2C3')
    expect(service.updateColour('INV1', '').ok).toBe(true)
    expect(em.inventory.find('INV1')?.colour).toBe('')
  })

  it('rejects malformed colours and unknown items', () => {
    const { service } = makeService()
    expect(service.updateColour('INV1', 'red')).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
    expect(service.updateColour('INV1', '#12345')).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
    expect(service.updateColour('INV9', '#ffffff')).toEqual({
      ok: false,
      error: 'inventoryDetail.notFound',
    })
  })
})

describe('updateLot', () => {
  it('saves quantity and amount (0 amount allowed)', () => {
    const { em, service } = makeService()
    const result = service.updateLot('L1', { quantity: 500, amount: 0 })
    expect(result.ok).toBe(true)
    const lot = em.lots.find('L1')
    expect(lot?.quantity).toBe(500)
    expect(lot?.amount).toBe(0)
  })

  it('rejects non-positive quantities, negative amounts and unknown lots', () => {
    const { service } = makeService()
    expect(service.updateLot('L1', { quantity: 0, amount: 1 })).toEqual({
      ok: false,
      error: 'inventoryDetail.lotQuantityInvalid',
    })
    expect(service.updateLot('L1', { quantity: NaN, amount: 1 })).toEqual({
      ok: false,
      error: 'inventoryDetail.lotQuantityInvalid',
    })
    expect(service.updateLot('L1', { quantity: 1, amount: -1 })).toEqual({
      ok: false,
      error: 'inventoryDetail.lotAmountInvalid',
    })
    expect(service.updateLot('L1', { quantity: 1, amount: NaN })).toEqual({
      ok: false,
      error: 'inventoryDetail.lotAmountInvalid',
    })
    expect(service.updateLot('L9', { quantity: 1, amount: 1 })).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
  })
})

describe('updateTransactionAmount', () => {
  it('saves a negative amount on an expense', () => {
    const { em, service } = makeService()
    const result = service.updateTransactionAmount('T1', -29.99)
    expect(result.ok).toBe(true)
    expect(em.transactions.find('T1')?.amount).toBe(-29.99)
  })

  it('rejects income rows, unknown ids and non-negative amounts', () => {
    const { service } = makeService()
    expect(service.updateTransactionAmount('T2', -1)).toEqual({
      ok: false,
      error: 'expenseTransactionDetail.notFound',
    })
    expect(service.updateTransactionAmount('T9', -1)).toEqual({
      ok: false,
      error: 'expenseTransactionDetail.notFound',
    })
    expect(service.updateTransactionAmount('T1', 0)).toEqual({
      ok: false,
      error: 'expenseTransactionDetail.amountInvalid',
    })
    expect(service.updateTransactionAmount('T1', 5)).toEqual({
      ok: false,
      error: 'expenseTransactionDetail.amountInvalid',
    })
    expect(service.updateTransactionAmount('T1', NaN)).toEqual({
      ok: false,
      error: 'expenseTransactionDetail.amountInvalid',
    })
  })
})
