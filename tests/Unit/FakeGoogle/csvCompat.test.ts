import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCsv as appParseCsv, serializeCsv as appSerializeCsv } from '@/Repository/LocalCsv/Csv'
import { parseCsv as mockParseCsv, serializeCsv as mockSerializeCsv } from 'google-drive-api-mock'

/**
 * `google-drive-api-mock` cannot import from `src/` (it must not depend on
 * the project it doubles for), so its CSV codec is a separate implementation
 * pinned by this contract test: both codecs must round-trip the same data
 * the same way, or the live double stops faithfully standing in for the
 * local-CSV backend's own on-disk format.
 */
describe('CSV codec compatibility with google-drive-api-mock', () => {
  const trickyMatrix = [
    ['id', 'name', 'notes'],
    ['1', 'Quoted, name', 'Has "quotes" inside'],
    ['2', 'Multi\nline note', ''],
    ['3', '', 'trailing empty field'],
  ]

  it('both codecs round-trip a tricky matrix back to the same values', () => {
    expect(appParseCsv(appSerializeCsv(trickyMatrix))).toEqual(trickyMatrix)
    expect(mockParseCsv(mockSerializeCsv(trickyMatrix))).toEqual(trickyMatrix)
  })

  it('each codec can parse the other codec\'s serialized output identically', () => {
    expect(appParseCsv(mockSerializeCsv(trickyMatrix))).toEqual(trickyMatrix)
    expect(mockParseCsv(appSerializeCsv(trickyMatrix))).toEqual(trickyMatrix)
  })

  it("parses the golden happy-path clients.csv fixture identically to the app's own codec", () => {
    const fixturePath = path.join(
      process.cwd(),
      'fixtures',
      'happy-path',
      'clients.csv',
    )
    const csvText = fs.readFileSync(fixturePath, 'utf8')

    expect(mockParseCsv(csvText)).toEqual(appParseCsv(csvText))
  })
})
