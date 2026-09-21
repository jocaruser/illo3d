import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '../../../..')

const ADAPTER_SOURCES = [
  'src/Component/audit/auditEntityResolver.ts',
  'src/Service/Search/globalSearch.ts',
  'src/Controller/TransactionsPage.tsx',
  'src/Component/MentionLinkify.tsx',
  'src/Component/dashboard/RecentTransactions.tsx',
]

describe('linking adoption guardrail', () => {
  it('routes in-scope surfaces through the shared resolver module', () => {
    for (const relativePath of ADAPTER_SOURCES) {
      const source = readFileSync(resolve(projectRoot, relativePath), 'utf8')
      expect(source, relativePath).toMatch(/entityLinkTargets/)
      expect(source, relativePath).not.toMatch(/#piece-\$\{/)
    }
  })
})
