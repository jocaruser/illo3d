import { describe, expect, it } from 'vitest'
import { isShopMetadata } from '@/Entity/ShopMetadata'

const valid = {
  app: 'illo3d',
  version: '3.0.0',
  spreadsheetId: 'sheet-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  createdBy: 'user@example.com',
}

describe('isShopMetadata', () => {
  it('accepts a minimal valid metadata object', () => {
    expect(isShopMetadata(valid)).toBe(true)
    expect(isShopMetadata({ ...valid, logo: 'logo.png', defaultDueDate: 7 })).toBe(true)
  })

  it('rejects non-objects', () => {
    expect(isShopMetadata(null)).toBe(false)
    expect(isShopMetadata(undefined)).toBe(false)
    expect(isShopMetadata('illo3d')).toBe(false)
  })

  it('rejects wrong or missing required fields', () => {
    expect(isShopMetadata({ ...valid, app: 'other' })).toBe(false)
    expect(isShopMetadata({ ...valid, version: 3 })).toBe(false)
    expect(isShopMetadata({ ...valid, spreadsheetId: undefined })).toBe(false)
    expect(isShopMetadata({ ...valid, createdAt: 5 })).toBe(false)
    expect(isShopMetadata({ ...valid, createdBy: null })).toBe(false)
  })
})
