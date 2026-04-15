import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { copyGoldenFixtureToE2eRoot, devLoginAndOpenCsvShop } from './fixtures'

const authFile = path.join(process.cwd(), 'tests/e2e/.auth/storage-state.json')

setup('authenticate', async ({ page }) => {
  copyGoldenFixtureToE2eRoot('happy-path')
  await devLoginAndOpenCsvShop(page)
  await page.waitForFunction(
    () => {
      const raw = globalThis.localStorage?.getItem('shop-storage')
      if (!raw) return false
      try {
        const parsed = JSON.parse(raw) as { state?: { activeShop?: unknown } }
        return parsed.state?.activeShop != null
      } catch {
        return false
      }
    },
    { timeout: 20000 },
  )
  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
