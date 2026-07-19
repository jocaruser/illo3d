import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseCsv, serializeCsv } from '@/Repository/LocalCsv/Csv'
import {
  parseCsv as emulatorParseCsv,
  serializeCsv as emulatorSerializeCsv,
} from 'google-drive-api-mock'

/**
 * Contract test against the external emulator (google-drive-api-mock):
 * its CSV codec and ours must speak the same dialect, or golden fixtures
 * stop being interchangeable between the local-csv backend and the
 * emulated Google backend. If this fails after a dependency bump, either
 * pin the previous emulator commit or align `LocalCsv/Csv.ts`.
 */

const TRICKY: string[][] = [
  ['id', 'name', 'notes'],
  ['c1', 'Acme, Inc.', 'quote " inside'],
  ['c2', 'multi\nline', '{"json":true,"nested":{"a":"b,c"}}'],
  ['c3', '', 'trailing space '],
]

describe('google-drive-api-mock CSV codec', () => {
  it('round-trips tricky matrices across both codecs', () => {
    expect(parseCsv(emulatorSerializeCsv(TRICKY))).toEqual(TRICKY)
    expect(emulatorParseCsv(serializeCsv(TRICKY))).toEqual(TRICKY)
  })

  it('reads the golden happy-path fixture identically to the app codec', () => {
    const text = fs.readFileSync(
      path.join(process.cwd(), 'fixtures', 'happy-path', 'clients.csv'),
      'utf8'
    )
    const viaEmulator = emulatorParseCsv(text)
    expect(viaEmulator).toEqual(parseCsv(text))
    expect(viaEmulator[0][0]).toBe('id')
  })
})
