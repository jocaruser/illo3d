import { describe, it, expect } from 'vitest'
import { isActiveRow, isActiveLot } from './entityFilters'

describe('isActiveRow', () => {
  it('returns true when archived and deleted are undefined', () => {
    expect(isActiveRow({})).toBe(true)
  })

  it('returns true when archived and deleted are absent', () => {
    expect(isActiveRow({ archived: undefined, deleted: undefined })).toBe(true)
  })

  it('returns true when archived and deleted are empty strings', () => {
    expect(isActiveRow({ archived: '', deleted: '' })).toBe(true)
  })

  it('returns false when archived is lowercase "true"', () => {
    expect(isActiveRow({ archived: 'true' })).toBe(false)
  })

  it('returns false when archived is uppercase "TRUE"', () => {
    expect(isActiveRow({ archived: 'TRUE' })).toBe(false)
  })

  it('returns false when archived is mixed-case "True"', () => {
    expect(isActiveRow({ archived: 'True' })).toBe(false)
  })

  it('returns false when deleted is lowercase "true"', () => {
    expect(isActiveRow({ deleted: 'true' })).toBe(false)
  })

  it('returns false when deleted is uppercase "TRUE"', () => {
    expect(isActiveRow({ deleted: 'TRUE' })).toBe(false)
  })

  it('returns false when either archived or deleted is "true"', () => {
    expect(isActiveRow({ archived: 'true', deleted: '' })).toBe(false)
    expect(isActiveRow({ archived: '', deleted: 'true' })).toBe(false)
    expect(isActiveRow({ archived: 'true', deleted: 'true' })).toBe(false)
  })
})

describe('isActiveLot', () => {
  it('returns true when archived and deleted are undefined', () => {
    expect(isActiveLot({})).toBe(true)
  })

  it('returns false when archived is lowercase "true"', () => {
    expect(isActiveLot({ archived: 'true' })).toBe(false)
  })

  it('returns false when archived is uppercase "TRUE"', () => {
    expect(isActiveLot({ archived: 'TRUE' })).toBe(false)
  })

  it('returns false when deleted is uppercase "TRUE"', () => {
    expect(isActiveLot({ deleted: 'TRUE' })).toBe(false)
  })
})
