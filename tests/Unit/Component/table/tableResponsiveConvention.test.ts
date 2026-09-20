import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const detailDir = join(process.cwd(), 'src/Component/detail')
const nthChildHide = /\[&_tr>\*:nth-child\(/

describe('table responsive convention', () => {
  it('does not use table-level nth-child hide strings in detail tables', () => {
    const offenders: string[] = []
    for (const name of readdirSync(detailDir)) {
      if (!name.endsWith('Table.tsx')) continue
      const source = readFileSync(join(detailDir, name), 'utf8')
      if (nthChildHide.test(source)) offenders.push(name)
    }
    expect(offenders).toEqual([])
  })
})
