import { describe, expect, it } from 'vitest'
import { INVENTORY_PURCHASE_CATEGORIES, PurchaseService } from '@/Service/PurchaseService'
import { auditTrail, makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  return { ...context, service: new PurchaseService(context.em) }
}

describe('overhead purchases', () => {
  it('creates a single negative expense with the notes as concept', () => {
    const { em, service, tabs } = makeService()
    const result = service.recordPurchase({
      category: 'electric',
      notes: '  March bill  ',
      addToInventory: false,
      amount: 42.5,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const transaction = em.transactions.find(result.transaction.id)
    expect(transaction?.type).toBe('expense')
    expect(transaction?.amount).toBe(-42.5)
    expect(transaction?.category).toBe('electric')
    expect(transaction?.concept).toBe('March bill')
    expect(transaction?.notes).toBe('March bill')
    expect(transaction?.date).toBe('2026-07-16')
    expect(auditTrail(tabs)).toEqual(['transaction/create/T1'])
  })

  it('falls back to the category as concept and honours an explicit date', () => {
    const { em, service } = makeService()
    const result = service.recordPurchase({
      category: 'maintenance',
      addToInventory: false,
      amount: 10,
      date: '2026-01-05',
    })
    expect(result.ok).toBe(true)
    const transaction = em.transactions.find('T1')
    expect(transaction?.concept).toBe('maintenance')
    expect(transaction?.date).toBe('2026-01-05')
  })

  it('rejects unknown categories and non-positive amounts', () => {
    const { service } = makeService()
    expect(
      service.recordPurchase({
        category: 'groceries' as never,
        addToInventory: false,
        amount: 5,
      }),
    ).toEqual({ ok: false, error: 'purchase.validation.required' })
    expect(service.recordPurchase({ category: 'other', addToInventory: false })).toEqual({
      ok: false,
      error: 'purchase.validation.amountPositive',
    })
    expect(
      service.recordPurchase({ category: 'other', addToInventory: false, amount: 0 }),
    ).toEqual({ ok: false, error: 'purchase.validation.amountPositive' })
    expect(
      service.recordPurchase({ category: 'other', addToInventory: false, amount: NaN }),
    ).toEqual({ ok: false, error: 'purchase.validation.amountPositive' })
  })
})

describe('inventory purchases', () => {
  it('creates the transaction, a new inventory item and its lot', () => {
    const { em, service } = makeService()
    const result = service.recordPurchase({
      category: 'filament',
      addToInventory: true,
      lines: [{ mode: 'new', name: ' PLA Red ', type: 'filament', quantity: 1000, amount: 19.99 }],
    })
    expect(result.ok).toBe(true)
    const transaction = em.transactions.find('T1')
    expect(transaction?.amount).toBe(-19.99)
    const item = em.inventory.find('INV1')
    expect(item?.name).toBe('PLA Red')
    expect(item?.type).toBe('filament')
    expect(item?.qtyCurrent).toBe(1000)
    expect(item?.warnYellow).toBe(0)
    expect(item?.warnOrange).toBe(0)
    expect(item?.warnRed).toBe(0)
    expect(item?.createdAt).toBe('2026-07-16T12:00:00.000Z')
    const lot = em.lots.find('L1')
    expect(lot?.inventoryId).toBe('INV1')
    expect(lot?.transactionId).toBe('T1')
    expect(lot?.quantity).toBe(1000)
    expect(lot?.amount).toBe(19.99)
  })

  it('increments an existing item and sums line amounts into the total', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('inventory', { id: 'INV1', type: 'consumable', name: 'Screws', qty_current: '10' })
    const result = service.recordPurchase({
      category: 'consumable',
      addToInventory: true,
      lines: [
        { mode: 'existing', inventoryId: 'INV1', quantity: 5, amount: 3 },
        { mode: 'new', name: 'Nuts', type: 'consumable', quantity: 20, amount: 2 },
      ],
    })
    expect(result.ok).toBe(true)
    expect(em.transactions.find('T1')?.amount).toBe(-5)
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(15)
    expect(em.inventory.find('INV2')?.name).toBe('Nuts')
    expect(em.lots.find('L1')?.inventoryId).toBe('INV1')
    expect(em.lots.find('L2')?.inventoryId).toBe('INV2')
  })

  it('restricts categories to the inventory trio', () => {
    const { service } = makeService()
    for (const category of INVENTORY_PURCHASE_CATEGORIES) {
      expect(
        service.recordPurchase({
          category,
          addToInventory: true,
          lines: [{ mode: 'new', name: 'X', type: 'consumable', quantity: 1, amount: 1 }],
        }).ok,
      ).toBe(true)
    }
    expect(
      service.recordPurchase({
        category: 'electric',
        addToInventory: true,
        lines: [{ mode: 'new', name: 'X', type: 'consumable', quantity: 1, amount: 1 }],
      }),
    ).toEqual({ ok: false, error: 'purchase.validation.required' })
  })

  it('validates lines before writing anything', () => {
    const { em, service } = makeService()
    expect(service.recordPurchase({ category: 'filament', addToInventory: true })).toEqual({
      ok: false,
      error: 'purchase.validation.lineRequired',
    })
    expect(
      service.recordPurchase({ category: 'filament', addToInventory: true, lines: [] }),
    ).toEqual({ ok: false, error: 'purchase.validation.lineRequired' })
    expect(
      service.recordPurchase({
        category: 'filament',
        addToInventory: true,
        lines: [{ mode: 'new', name: 'X', type: 'filament', quantity: 0, amount: 1 }],
      }),
    ).toEqual({ ok: false, error: 'purchase.validation.quantityPositive' })
    expect(
      service.recordPurchase({
        category: 'filament',
        addToInventory: true,
        lines: [{ mode: 'new', name: 'X', type: 'filament', quantity: 1, amount: 0 }],
      }),
    ).toEqual({ ok: false, error: 'purchase.validation.amountPositive' })
    expect(
      service.recordPurchase({
        category: 'filament',
        addToInventory: true,
        lines: [{ mode: 'new', name: '  ', type: 'filament', quantity: 1, amount: 1 }],
      }),
    ).toEqual({ ok: false, error: 'purchase.validation.inventoryNameRequired' })
    expect(
      service.recordPurchase({
        category: 'filament',
        addToInventory: true,
        lines: [
          { mode: 'new', name: 'Ok', type: 'filament', quantity: 1, amount: 1 },
          { mode: 'existing', inventoryId: 'INV9', quantity: 1, amount: 1 },
        ],
      }),
    ).toEqual({ ok: false, error: 'inventoryDetail.notFound' })
    // Nothing was written by any of the rejected purchases.
    expect(em.transactions.findAll()).toEqual([])
    expect(em.inventory.findAll()).toEqual([])
    expect(em.lots.findAll()).toEqual([])
  })
})
