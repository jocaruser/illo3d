import type { Page } from '@playwright/test'
import { test, expect, mockDirectoryPicker } from './fixtures'

/**
 * The migration wizard, end to end on the local backend (ADR-0012): opening a
 * shop whose metadata major lags the app's opens the modal; Continue runs the
 * plan chain entirely in memory (the optional backup is written at its own
 * step); only **Confirm and close** persists the migrated tabs and flips the
 * version, so a reload before pressing it loses the run and a failed run
 * leaves the shop untouched. A shop AHEAD of the app, or with an unreadable
 * version, is told so on the welcome screen instead of getting the wizard.
 *
 * `serial`: all specs share the one `.e2e-fixtures` tree.
 */
test.describe.configure({ mode: 'serial' })

test.use({ storageState: { cookies: [], origins: [] } })

async function openShopExpectingMigration(page: Page, scenario: string): Promise<void> {
  await page.goto('/#/dashboard', { waitUntil: 'load' })
  await mockDirectoryPicker(page, scenario, 'with-metadata')
  const localButton = page.getByTestId('wizard-local-folder')
  await expect(localButton).toBeVisible({ timeout: 15000 })
  await localButton.click()
  await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({ timeout: 15000 })
}

async function answerBackupAndContinue(
  page: Page,
  answer: 'wizard-backup-yes' | 'wizard-backup-no'
): Promise<void> {
  const continueButton = page.getByTestId('wizard-migration-continue')
  await expect(continueButton).toBeDisabled()
  await page.getByTestId(answer).click()
  // The 5s cooldown ring gives way to a checkmark; only then does Continue arm.
  await expect(page.getByTestId('wizard-cooldown-check')).toBeVisible({ timeout: 10000 })
  await expect(continueButton).toBeEnabled()
  await continueButton.click()
}

/** The in-memory run has finished when Confirm and close replaces Continue. */
async function expectRunReady(page: Page): Promise<void> {
  await expect(page.getByTestId('wizard-migration-confirm')).toBeVisible({ timeout: 20000 })
  await expect(page.getByTestId('wizard-migration-summary')).toHaveText(
    /All done|Todo completado/
  )
  await expect(page.getByTestId('wizard-migration-continue')).toHaveCount(0)
}

/** A file's contents from the mocked directory store, or null when absent. */
function fixtureFile(page: Page, name: string): Promise<string | null> {
  return page.evaluate((fileName) => {
    const store = JSON.parse(
      localStorage.getItem('__e2eFixtureFiles') ?? '{}'
    ) as Record<string, string>
    return store[fileName] ?? null
  }, name)
}

async function shopMetadataVersion(page: Page): Promise<string | null> {
  const text = await fixtureFile(page, 'illo3d.metadata.json')
  return text === null ? null : (JSON.parse(text) as { version: string }).version
}

/** Whether a `<today>.v<from>.backup/` copy exists in the mocked folder. */
function hasBackupDir(page: Page, fromVersion: string): Promise<boolean> {
  return page.evaluate((version) => {
    const prefix = `${new Date().toISOString().slice(0, 10)}.v${version}.backup/`
    const store = JSON.parse(
      localStorage.getItem('__e2eFixtureFiles') ?? '{}'
    ) as Record<string, string>
    return Object.keys(store).some((key) => key.startsWith(prefix))
  }, fromVersion)
}

/** Rewrite the mocked shop's metadata version (before the shop is opened). */
async function overwriteMetadataVersion(page: Page, version: string): Promise<void> {
  await page.evaluate(async (newVersion) => {
    const target = window as unknown as {
      __e2eMockDirectoryHandle: FileSystemDirectoryHandle
    }
    const handle = await target.__e2eMockDirectoryHandle.getFileHandle('illo3d.metadata.json')
    const metadata = JSON.parse(await (await handle.getFile()).text()) as { version: string }
    metadata.version = newVersion
    const writable = await handle.createWritable()
    await writable.write(JSON.stringify(metadata))
    await writable.close()
  }, version)
}

/** Rename a column in the mocked jobs.csv header so the jobs step fails. */
async function corruptJobsHeader(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const target = window as unknown as {
      __e2eMockDirectoryHandle: FileSystemDirectoryHandle
    }
    const handle = await target.__e2eMockDirectoryHandle.getFileHandle('jobs.csv')
    const text = await (await handle.getFile()).text()
    const writable = await handle.createWritable()
    await writable.write(text.replace('description', 'renamed_column'))
    await writable.close()
  })
}

test.describe('Migration wizard: v2 shop', () => {
  test.use({ fixtureScenario: 'pre-v3-upgrade' })

  test('runs in memory; only Confirm and close persists — a reload loses the run', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openShopExpectingMigration(page, 'pre-v3-upgrade')

    // The modal names both versions.
    await expect(page.getByText('2.0.0')).toBeVisible()
    await expect(page.getByText('3.0.0')).toBeVisible()

    // The explanation derives from the v2→v3 hop alone, ending on the promise.
    await expect(page.getByText('Due dates on jobs')).toBeVisible()
    await expect(page.getByText('Colours on materials')).toBeVisible()
    await expect(page.getByText('No data is removed or altered.')).toBeVisible()
    await expect(page.getByText('Audit logging')).toHaveCount(0)

    // Declining the backup warns; deselecting withdraws the warning.
    await page.getByTestId('wizard-backup-no').click()
    await expect(page.getByTestId('wizard-backup-warning')).toBeVisible()
    await page.getByTestId('wizard-backup-no').click()
    await expect(page.getByTestId('wizard-backup-warning')).not.toBeVisible()

    await answerBackupAndContinue(page, 'wizard-backup-no')
    await expectRunReady(page)

    // Nothing has been written: the shop on disk is still the v2 original.
    expect(await shopMetadataVersion(page)).toBe('2.0.0')
    expect(await hasBackupDir(page, '2.0.0')).toBe(false)

    // The run only ever existed in memory — a reload loses it entirely…
    await page.reload({ waitUntil: 'load' })
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-local-folder').click()
    // …and reopening the shop shows the wizard again, from the start.
    await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-migration-confirm')).toHaveCount(0)
    await expect(page.getByText('2.0.0')).toBeVisible()
    expect(await shopMetadataVersion(page)).toBe('2.0.0')

    // This time, commit: the migrated shop persists and opens.
    await answerBackupAndContinue(page, 'wizard-backup-no')
    await expectRunReady(page)
    await page.getByTestId('wizard-migration-confirm').click()

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })
    await expect(page.getByTestId('global-header-search')).toBeVisible()
    expect(await shopMetadataVersion(page)).toBe('3.0.0')
    // Backup was skipped: nothing extra is kept.
    expect(await hasBackupDir(page, '2.0.0')).toBe(false)
  })

  test('log out abandons the migration and returns to the welcome screen', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openShopExpectingMigration(page, 'pre-v3-upgrade')

    await page.getByTestId('wizard-migration-logout').click()

    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-migration-continue')).toHaveCount(0)
  })

  test('a failed step leaves the shop untouched and reopenable — the backup stays', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await mockDirectoryPicker(page, 'pre-v3-upgrade', 'with-metadata')
    await corruptJobsHeader(page)
    await page.getByTestId('wizard-local-folder').click()
    await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({ timeout: 15000 })

    await answerBackupAndContinue(page, 'wizard-backup-yes')

    // The run halts on the red jobs card with the failure alert.
    await expect(page.getByTestId('wizard-migration-failed')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('wizard-migration-failed')).toContainText(
      /Migration failed|La migración ha fallado/
    )
    await expect(page.getByLabel(/Jobs: failed|Trabajos: fallido/)).toBeVisible()
    await expect(page.getByTestId('wizard-migration-confirm')).toHaveCount(0)

    // Nothing was written — except the backup, taken at its own step.
    expect(await shopMetadataVersion(page)).toBe('2.0.0')
    expect(await hasBackupDir(page, '2.0.0')).toBe(true)

    // The untouched shop reopens straight into the wizard again.
    await page.getByTestId('wizard-migration-logout').click()
    await expect(page.getByTestId('wizard-local-folder')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('wizard-local-folder').click()
    await expect(page.getByTestId('wizard-migration-continue')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('2.0.0')).toBeVisible()
  })
})

test.describe('Migration wizard: v1 shop', () => {
  test.use({ fixtureScenario: 'pre-v2-upgrade' })

  test('chains v1→v2→v3 with the backup written at its step, then commits', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await openShopExpectingMigration(page, 'pre-v2-upgrade')

    await expect(page.getByText('1.5.0')).toBeVisible()
    await expect(page.getByText('3.0.0')).toBeVisible()

    // A chained run explains every hop, in order.
    await expect(page.getByText('Audit logging')).toBeVisible()
    await expect(page.getByText('Due dates on jobs')).toBeVisible()

    await answerBackupAndContinue(page, 'wizard-backup-yes')
    await expectRunReady(page)

    // The backup exists from its step onwards — before anything is committed.
    expect(await hasBackupDir(page, '1.5.0')).toBe(true)
    expect(await shopMetadataVersion(page)).toBe('1.5.0')

    await page.getByTestId('wizard-migration-confirm').click()
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })
    expect(await shopMetadataVersion(page)).toBe('3.0.0')

    // The v1→v2 plan recorded every pre-existing row as a `migration` entry.
    // (Scope to the table body: the filter <select> also holds a hidden
    // "Migration" <option>, which `getByText` would match first.)
    await page.goto('/#/audit-log', { waitUntil: 'load' })
    await expect(page.getByTestId('audit-log-page')).toBeVisible({ timeout: 15000 })
    await expect(
      page.locator('tbody tr').filter({ hasText: /migration/i }).first()
    ).toBeVisible()
    await expect(page.getByTestId('audit-log-empty-state')).toHaveCount(0)
  })
})

test.describe('Newer or unreadable shops stay off the wizard', () => {
  test.use({ fixtureScenario: 'happy-path' })

  test('a shop made by a newer app major is told to update the app', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await mockDirectoryPicker(page, 'happy-path', 'with-metadata')
    await overwriteMetadataVersion(page, '9.9.9')

    await page.getByTestId('wizard-local-folder').click()

    await expect(page.getByTestId('wizard-error')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-error')).toContainText(
      /newer version of this app|versión más reciente/
    )
    await expect(page.getByTestId('wizard-migration-continue')).toHaveCount(0)
  })

  test('a shop whose version cannot be read is told so', async ({
    page,
    prepareFixtureDir,
  }) => {
    void prepareFixtureDir
    await page.goto('/#/dashboard', { waitUntil: 'load' })
    await mockDirectoryPicker(page, 'happy-path', 'with-metadata')
    await overwriteMetadataVersion(page, 'not-a-version')

    await page.getByTestId('wizard-local-folder').click()

    await expect(page.getByTestId('wizard-error')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('wizard-error')).toContainText(
      /version could not be read|No se ha podido leer/
    )
    await expect(page.getByTestId('wizard-migration-continue')).toHaveCount(0)
  })
})
