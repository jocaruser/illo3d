import { describe, expect, it } from 'vitest'
import {
  DATA_SHEET_NAMES,
  LIFECYCLE_COLUMNS,
  METADATA_FILE_NAME,
  SHEET_HEADERS,
  SHEET_NAMES,
  SPREADSHEET_NAME,
  isSheetName,
} from '@/Config/schema'

describe('schema invariants', () => {
  it('lists 11 sheets ending with audit_log', () => {
    expect(SHEET_NAMES).toHaveLength(11)
    expect(SHEET_NAMES[SHEET_NAMES.length - 1]).toBe('audit_log')
  })

  it('DATA_SHEET_NAMES excludes only audit_log', () => {
    expect(DATA_SHEET_NAMES).toEqual(SHEET_NAMES.filter((name) => name !== 'audit_log'))
    expect(DATA_SHEET_NAMES).not.toContain('audit_log')
  })

  it('every data sheet carries the lifecycle columns; audit_log does not', () => {
    for (const sheet of DATA_SHEET_NAMES) {
      expect(SHEET_HEADERS[sheet]).toContain('archived')
      expect(SHEET_HEADERS[sheet]).toContain('deleted')
    }
    expect(SHEET_HEADERS.audit_log).not.toContain('archived')
    expect(SHEET_HEADERS.audit_log).not.toContain('deleted')
  })

  it('data sheets end with archived,deleted except the v3 appended columns', () => {
    for (const sheet of DATA_SHEET_NAMES) {
      if (sheet === 'jobs' || sheet === 'inventory') continue
      expect(SHEET_HEADERS[sheet].slice(-2)).toEqual([...LIFECYCLE_COLUMNS])
    }
  })

  it('jobs ends with due_date appended after the lifecycle columns', () => {
    expect(SHEET_HEADERS.jobs.slice(-3)).toEqual(['archived', 'deleted', 'due_date'])
  })

  it('inventory ends with colour appended after the lifecycle columns', () => {
    expect(SHEET_HEADERS.inventory.slice(-3)).toEqual(['archived', 'deleted', 'colour'])
  })

  it('every header starts with id and has no duplicate columns', () => {
    for (const sheet of SHEET_NAMES) {
      const header = SHEET_HEADERS[sheet]
      expect(header[0]).toBe('id')
      expect(new Set(header).size).toBe(header.length)
    }
  })

  it('names the workbook and metadata files', () => {
    expect(SPREADSHEET_NAME).toBe('illo3d-data')
    expect(METADATA_FILE_NAME).toBe('illo3d.metadata.json')
  })

  it('isSheetName narrows sheet names', () => {
    expect(isSheetName('jobs')).toBe(true)
    expect(isSheetName('audit_log')).toBe(true)
    expect(isSheetName('nope')).toBe(false)
  })
})
