import { describe, expect, it } from 'vitest'
import { INVENTORY_TYPES, InventoryItem, parseInventoryType } from '@/Entity/InventoryItem'

const record = {
  id: 'INV1',
  type: 'filament',
  name: 'PLA Red',
  qty_current: '750.5',
  warn_yellow: '500',
  warn_orange: '250',
  warn_red: '100',
  created_at: '2026-01-01T00:00:00.000Z',
  archived: '',
  deleted: '',
  colour: '#ff0000',
}

describe('InventoryItem', () => {
  it('round-trips fromRecord/toRecord', () => {
    const item = InventoryItem.fromRecord(record)
    expect(item.type).toBe('filament')
    expect(item.qtyCurrent).toBe(750.5)
    expect(item.colour).toBe('#ff0000')
    expect(item.toRecord()).toEqual(record)
  })

  it('defaults missing numerics to 0 and type to consumable', () => {
    const item = InventoryItem.fromRecord({})
    expect(item.type).toBe('consumable')
    expect(item.qtyCurrent).toBe(0)
    expect(item.warnYellow).toBe(0)
    expect(item.warnOrange).toBe(0)
    expect(item.warnRed).toBe(0)
    expect(item.colour).toBe('')
  })

  it('parseInventoryType falls back to consumable', () => {
    for (const type of INVENTORY_TYPES) expect(parseInventoryType(type)).toBe(type)
    expect(parseInventoryType('bogus')).toBe('consumable')
  })

  it('stockAlertLevel precedence red > orange > yellow, 0 disables a tier', () => {
    const item = InventoryItem.fromRecord(record)
    item.qtyCurrent = 50
    expect(item.stockAlertLevel()).toBe('red')
    item.qtyCurrent = 200
    expect(item.stockAlertLevel()).toBe('orange')
    item.qtyCurrent = 400
    expect(item.stockAlertLevel()).toBe('yellow')
    item.qtyCurrent = 600
    expect(item.stockAlertLevel()).toBeNull()

    item.warnRed = 0
    item.qtyCurrent = 50
    expect(item.stockAlertLevel()).toBe('orange')
    item.warnOrange = 0
    expect(item.stockAlertLevel()).toBe('yellow')
    item.warnYellow = 0
    expect(item.stockAlertLevel()).toBeNull()
  })
})
