import { describe, expect, it } from 'vitest'
import { PieceItem } from '@/Entity/PieceItem'

describe('PieceItem', () => {
  it('round-trips fromRecord/toRecord', () => {
    const record = {
      id: 'PI1',
      piece_id: 'P1',
      inventory_id: 'INV1',
      quantity: '12.5',
      archived: '',
      deleted: 'true',
    }
    const item = PieceItem.fromRecord(record)
    expect(item.quantity).toBe(12.5)
    expect(item.isDeleted()).toBe(true)
    expect(item.toRecord()).toEqual(record)
  })

  it('defaults missing cells and keeps quantity unset', () => {
    const item = PieceItem.fromRecord({})
    expect(item.quantity).toBeUndefined()
    expect(item.toRecord()).toEqual({
      id: '',
      piece_id: '',
      inventory_id: '',
      quantity: '',
      archived: '',
      deleted: '',
    })
  })
})
