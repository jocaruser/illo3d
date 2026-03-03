import { describe, it, expect } from 'vitest'
import { getDevFixtures } from './devLogin'

describe('getDevFixtures', () => {
  it('returns fixture with user, credentials, and shop', () => {
    const fixtures = getDevFixtures()

    expect(fixtures.user).toEqual({
      email: 'dev@illo3d.local',
      name: 'Dev User',
    })
    expect(fixtures.credentials).toEqual({
      accessToken: 'dev-fake-token',
    })
    expect(fixtures.shop).toEqual({
      folderId: 'dev-fixture-folder-id',
      folderName: 'Dev Fixture Shop',
      spreadsheetId: 'dev-fixture-spreadsheet-id',
      metadataVersion: '1.0.0',
    })
  })

  it('returns all required shop fields', () => {
    const { shop } = getDevFixtures()

    expect(shop).toHaveProperty('folderId')
    expect(shop).toHaveProperty('folderName')
    expect(shop).toHaveProperty('spreadsheetId')
    expect(shop).toHaveProperty('metadataVersion')
    expect(typeof shop.folderId).toBe('string')
    expect(typeof shop.folderName).toBe('string')
    expect(typeof shop.spreadsheetId).toBe('string')
    expect(typeof shop.metadataVersion).toBe('string')
  })
})
