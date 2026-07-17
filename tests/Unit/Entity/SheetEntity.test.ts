import { describe, expect, it } from 'vitest'
import { Client } from '@/Entity/Client'
import { isLifecycleTrue, numericCell, parseNumericCell } from '@/Entity/SheetEntity'

describe('isLifecycleTrue', () => {
  it('accepts any casing of true with whitespace', () => {
    expect(isLifecycleTrue('true')).toBe(true)
    expect(isLifecycleTrue('TRUE')).toBe(true)
    expect(isLifecycleTrue(' True ')).toBe(true)
  })

  it('rejects everything else', () => {
    expect(isLifecycleTrue('')).toBe(false)
    expect(isLifecycleTrue('false')).toBe(false)
    expect(isLifecycleTrue('yes')).toBe(false)
  })
})

describe('parseNumericCell', () => {
  it('parses numbers and trims whitespace', () => {
    expect(parseNumericCell('12.5')).toBe(12.5)
    expect(parseNumericCell(' -3 ')).toBe(-3)
    expect(parseNumericCell('0')).toBe(0)
  })

  it('returns undefined for blank or non-numeric content', () => {
    expect(parseNumericCell('')).toBeUndefined()
    expect(parseNumericCell('   ')).toBeUndefined()
    expect(parseNumericCell('abc')).toBeUndefined()
    expect(parseNumericCell('Infinity')).toBeUndefined()
  })
})

describe('numericCell', () => {
  it('serializes numbers and blanks undefined', () => {
    expect(numericCell(7)).toBe('7')
    expect(numericCell(0)).toBe('0')
    expect(numericCell(undefined)).toBe('')
  })
})

describe('lifecycle semantics', () => {
  it('active = neither archived nor deleted (case-insensitive)', () => {
    const entity = new Client()
    expect(entity.isActive()).toBe(true)
    expect(entity.isArchived()).toBe(false)
    expect(entity.isDeleted()).toBe(false)

    entity.archived = 'TRUE'
    expect(entity.isArchived()).toBe(true)
    expect(entity.isActive()).toBe(false)

    entity.archived = ''
    entity.deleted = 'true'
    expect(entity.isDeleted()).toBe(true)
    expect(entity.isActive()).toBe(false)
  })
})
