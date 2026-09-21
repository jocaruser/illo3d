import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const listPages = [
  'ClientsPage.tsx',
  'JobsPage.tsx',
  'InventoryPage.tsx',
  'TransactionsPage.tsx',
  'AuditLogPage.tsx',
] as const

const controllerDir = join(process.cwd(), 'src/Controller')

describe('list table discovery contract', () => {
  it('top-level list pages use the shared harness instead of ad hoc query state', () => {
    for (const file of listPages) {
      const source = readFileSync(join(controllerDir, file), 'utf8')
      expect(source).toContain('useListTableDiscovery')
      expect(source).not.toMatch(
        /import\s*\{[^}]*fuzzyFilter[^}]*\}\s*from\s*'@\/Service\/Search\/fuzzyFilter'/
      )
      expect(source).not.toMatch(/useState\([^)]*\)\s*\/\/.*query/)
      expect(source).not.toMatch(/const\s*\[query,\s*setQuery\]\s*=\s*useState/)
    }
  })
})
