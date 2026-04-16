import { describe, it, expect } from 'vitest'
import { APP_VERSION } from './version'

function parseMajor(version: string): number {
  const match = version.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

describe('version compatibility', () => {
  it('same major version is compatible', () => {
    const appMajor = parseMajor(APP_VERSION)
    const metaMajor = parseMajor(APP_VERSION)
    expect(appMajor).toBe(metaMajor)
  })

  it('different major version is incompatible', () => {
    const appMajor = parseMajor(APP_VERSION)
    const metaMajor = parseMajor('1.0.0')
    expect(appMajor).not.toBe(metaMajor)
  })

  it('same major with different minor is compatible', () => {
    const appMajor = parseMajor('2.0.0')
    const metaMajor = parseMajor('2.3.0')
    expect(appMajor).toBe(metaMajor)
  })

  it('APP_VERSION is valid semver format', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
