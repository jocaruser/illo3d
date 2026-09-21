import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const PROJECT_ROOT = join(import.meta.dirname, '../../..')

const SELECT_IMPORT = `@/Component/${'Select'}`

/** Product UI may import Select only from these paths (form primitives and tests). */
const ALLOWLIST = new Set([
  'src/Component/detail/CreatePurchaseDialog.tsx',
  'tests/Unit/Component/Select.test.tsx',
])

function collectSourceFiles(directory: string, relativeTo: string): string[] {
  const absolute = join(relativeTo, directory)
  const entries = readdirSync(absolute)
  const files: string[] = []
  for (const name of entries) {
    const path = join(absolute, name)
    const rel = join(directory, name).replace(/\\/g, '/')
    if (statSync(path).isDirectory()) {
      if (name === 'node_modules' || name === 'dist') continue
      files.push(...collectSourceFiles(rel, relativeTo))
      continue
    }
    if (/\.(ts|tsx)$/.test(name) && !rel.endsWith('selectUsageAllowlist.test.ts')) {
      files.push(rel)
    }
  }
  return files
}

function filesImportingSelect(): string[] {
  const offenders: string[] = []
  for (const file of [
    ...collectSourceFiles('src', PROJECT_ROOT),
    ...collectSourceFiles('tests', PROJECT_ROOT),
  ]) {
    const content = readFileSync(join(PROJECT_ROOT, file), 'utf8')
    if (!content.includes(SELECT_IMPORT)) continue
    if (!ALLOWLIST.has(file)) offenders.push(file)
  }
  return offenders.sort()
}

describe('Select usage allowlist', () => {
  it('limits @/Component/Select imports to documented exception paths', () => {
    expect(filesImportingSelect()).toEqual([])
  })
})
