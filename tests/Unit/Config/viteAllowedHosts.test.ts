import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('vite.config.ts allowedHosts', () => {
  const configSource = readFileSync(
    resolve(process.cwd(), 'vite.config.ts'),
    'utf8',
  )

  it('allows any host on the dev server for sandbox capture paths', () => {
    expect(configSource).toMatch(
      /server:\s*\{[\s\S]*?allowedHosts:\s*true/,
    )
  })

  it('allows any host on the preview server for sandbox capture paths', () => {
    expect(configSource).toMatch(
      /preview:\s*\{[\s\S]*?allowedHosts:\s*true/,
    )
  })
})
