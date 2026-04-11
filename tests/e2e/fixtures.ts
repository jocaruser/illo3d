import { test as base, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

export const test = base.extend<{
  fixtureScenario: string
  _prepareFixtureDir: void
}>({
  fixtureScenario: ['happy-path', { option: true }],
  _prepareFixtureDir: [
    async ({ fixtureScenario }, use) => {
      const goldenDir = path.join(process.cwd(), 'fixtures', fixtureScenario)
      if (!fs.existsSync(goldenDir)) {
        throw new Error(`Golden fixture scenario not found: ${fixtureScenario}`)
      }
      const destRoot = path.join(process.cwd(), '.e2e-fixtures')
      const destDir = path.join(destRoot, fixtureScenario)
      fs.rmSync(destDir, { recursive: true, force: true })
      fs.mkdirSync(destRoot, { recursive: true })
      fs.cpSync(goldenDir, destDir, { recursive: true })
      await use()
    },
    { auto: true },
  ],
})

export { expect }
