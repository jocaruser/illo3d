import { describe, expect, it } from 'vitest'
import { SHEET_HEADERS } from '@/Config/schema'
import {
  appendRecord,
  emptyMatrix,
  findRecordById,
  findRowIndexById,
  matrixToRecords,
  normalizeMatrix,
  recordToRow,
  removeRecordById,
  rowToRecord,
  updateRecordById,
} from '@/Repository/Matrix'

describe('emptyMatrix', () => {
  it('returns only the canonical header row (a fresh copy)', () => {
    const matrix = emptyMatrix('tags')
    expect(matrix).toEqual([['id', 'name', 'created_at', 'archived', 'deleted']])
    expect(matrix[0]).not.toBe(SHEET_HEADERS.tags)
  })
})

describe('normalizeMatrix', () => {
  it('replaces the stored header, pads short rows and truncates long ones', () => {
    const matrix = normalizeMatrix('tags', [
      ['id', 'name'],
      ['TG1', 'Vip'],
      ['TG2', 'Old', '2026-01-01', 'true', '', 'extra'],
    ])
    expect(matrix[0]).toEqual([...SHEET_HEADERS.tags])
    expect(matrix[1]).toEqual(['TG1', 'Vip', '', '', ''])
    expect(matrix[2]).toEqual(['TG2', 'Old', '2026-01-01', 'true', ''])
  })

  it('drops fully blank rows', () => {
    const matrix = normalizeMatrix('tags', [
      ['id'],
      ['', '  ', ''],
      ['TG1', 'Vip', '', '', ''],
    ])
    expect(matrix).toHaveLength(2)
    expect(matrix[1][0]).toBe('TG1')
  })
})

describe('row/record conversion', () => {
  it('rowToRecord keys cells by canonical header and blanks missing cells', () => {
    expect(rowToRecord('tags', ['TG1', 'Vip'])).toEqual({
      id: 'TG1',
      name: 'Vip',
      created_at: '',
      archived: '',
      deleted: '',
    })
  })

  it('recordToRow orders values canonically and blanks missing keys', () => {
    expect(recordToRow('tags', { name: 'Vip', id: 'TG1' })).toEqual(['TG1', 'Vip', '', '', ''])
  })

  it('matrixToRecords converts every data row', () => {
    const matrix = appendRecord('tags', emptyMatrix('tags'), { id: 'TG1', name: 'Vip' })
    expect(matrixToRecords('tags', matrix)).toEqual([
      { id: 'TG1', name: 'Vip', created_at: '', archived: '', deleted: '' },
    ])
  })
})

describe('id-based operations', () => {
  const matrix = appendRecord(
    'tags',
    appendRecord('tags', emptyMatrix('tags'), { id: 'TG1', name: 'One' }),
    { id: 'TG2', name: 'Two' },
  )

  it('findRowIndexById is 0-based over data rows', () => {
    expect(findRowIndexById('tags', matrix, 'TG1')).toBe(0)
    expect(findRowIndexById('tags', matrix, 'TG2')).toBe(1)
    expect(findRowIndexById('tags', matrix, 'TG9')).toBe(-1)
  })

  it('findRecordById returns the record or null', () => {
    expect(findRecordById('tags', matrix, 'TG2')?.name).toBe('Two')
    expect(findRecordById('tags', matrix, 'TG9')).toBeNull()
  })

  it('updateRecordById replaces the matching row immutably', () => {
    const next = updateRecordById('tags', matrix, { id: 'TG1', name: 'Renamed' })
    expect(findRecordById('tags', next, 'TG1')?.name).toBe('Renamed')
    expect(findRecordById('tags', matrix, 'TG1')?.name).toBe('One')
  })

  it('updateRecordById throws for unknown ids', () => {
    expect(() => updateRecordById('tags', matrix, { id: 'TG9' })).toThrow(
      "Row 'TG9' not found in sheet 'tags'",
    )
  })

  it('removeRecordById drops the row, ignoring unknown ids', () => {
    const next = removeRecordById('tags', matrix, 'TG1')
    expect(next).toHaveLength(2)
    expect(findRecordById('tags', next, 'TG1')).toBeNull()
    expect(removeRecordById('tags', matrix, 'TG9')).toBe(matrix)
  })
})
