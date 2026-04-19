import { describe, it, expect } from 'vitest'
import { isGoogleDriveStyleShop } from './googleDriveShop'

describe('isGoogleDriveStyleShop', () => {
  const driveShop = {
    folderId: 'abc',
    folderName: 'S',
    spreadsheetId: '1sheetFromGoogle',
    metadataVersion: '1.0.0',
  }

  it('returns false when shop is null', () => {
    expect(isGoogleDriveStyleShop('google-drive', null)).toBe(false)
  })

  it('returns false when folderId is empty', () => {
    expect(isGoogleDriveStyleShop('google-drive', { ...driveShop, folderId: '' })).toBe(false)
  })

  it('returns false for local-csv backend', () => {
    expect(isGoogleDriveStyleShop('local-csv', driveShop)).toBe(false)
  })

  it('returns false for local spreadsheet id', () => {
    expect(
      isGoogleDriveStyleShop(null, {
        ...driveShop,
        spreadsheetId: 'local-mydir',
      }),
    ).toBe(false)
  })

  it('returns false for csv fixture spreadsheet id', () => {
    expect(
      isGoogleDriveStyleShop(null, {
        ...driveShop,
        spreadsheetId: 'csv-fixture-happy-path',
      }),
    ).toBe(false)
  })

  it('returns true for google-drive backend and normal shop', () => {
    expect(isGoogleDriveStyleShop('google-drive', driveShop)).toBe(true)
  })

  it('returns true when backend was lost but shop is clearly Drive', () => {
    expect(isGoogleDriveStyleShop(null, driveShop)).toBe(true)
  })
})
