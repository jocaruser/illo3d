import { describe, expect, it } from 'vitest'
import { APP_VERSION, parseMajorVersion } from '@/Config/version'

describe('version', () => {
  it('APP_VERSION is major 3', () => {
    expect(parseMajorVersion(APP_VERSION)).toBe(3)
  })

  it('parses the major segment', () => {
    expect(parseMajorVersion('2.1.0')).toBe(2)
    expect(parseMajorVersion(' 10.0.0 ')).toBe(10)
  })

  it('returns null for unparseable versions', () => {
    expect(parseMajorVersion('')).toBeNull()
    expect(parseMajorVersion('three')).toBeNull()
    expect(parseMajorVersion('3')).toBeNull()
  })
})
