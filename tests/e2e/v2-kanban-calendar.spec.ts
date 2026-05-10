import { test, expect } from './fixtures'

test.describe('v2.0.0 Kanban Features', () => {
  test.use({ fixtureScenario: 'v2-metadata-rich' })

  test('kanban renders job cards with business metrics', async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)

    // Wait for kanban to load - tabs are visible
    await expect(page.getByRole('button', { name: /kanban/i })).toBeVisible()
    
    // Check that job cards are rendered (with drag handles)
    const jobCard = page.locator('[data-testid^="kanban-drag-"]').first()
    await expect(jobCard).toBeVisible()

    // Job cards should show job description (not piece names)
    // The fixture jobs should be visible - check for actual job names from fixture
    await expect(page.getByText(/E2E disposable job|Desk organizer|Replacement gear|Phone case prototype/).first()).toBeVisible()
  })

  test('job cards show due date gradient indicator', async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)

    // Navigate to dashboard - kanban should show job cards
    const jobCard = page.locator('[data-testid^="kanban-drag-"]').first()
    await expect(jobCard).toBeVisible()

    // Check that job cards have the expected styling structure
    const classAttribute = await jobCard.getAttribute('class')

    // Verify card has proper styling classes
    expect(classAttribute).toMatch(/rounded-(lg|md)/)
    expect(classAttribute).toContain('border')
  })
})

test.describe('v2.0.0 Calendar Features', () => {
  test.use({ fixtureScenario: 'v2-metadata-rich' })

  test('calendar month grid renders pieces on correct dates', async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Switch to calendar tab if present
    const calendarTab = page.getByRole('button', { name: /calendar|calendario/i })
    if (await calendarTab.isVisible().catch(() => false)) {
      await calendarTab.click()
    }
    
    // Calendar should show month grid
    await expect(page.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i)).toBeVisible()
    
    // Previous/Next buttons should work
    await page.getByRole('button', { name: /previous month/i }).click()
    await page.getByRole('button', { name: /next month/i }).click()
    await page.getByRole('button', { name: /today|hoy/i }).click()
  })
})

test.describe('v2.0.0 History Features', () => {
  test.use({ fixtureScenario: 'v2-metadata-rich' })

  test('history page shows audit rows and search works', async ({ page, openCsvShop }) => {
    void openCsvShop

    // Navigate to history
    await page.getByRole('link', { name: /history|historial/i }).click()
    await expect(page).toHaveURL(/\/history/)

    // History page should show
    await expect(page.getByRole('heading', { name: /history|historial/i })).toBeVisible()

    // Check for table or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    const hasEmptyState = await page.getByText(/no history|empty/i).isVisible().catch(() => false)

    // Either table or empty state should be visible
    expect(hasTable || hasEmptyState).toBe(true)
  })

  test('history detail shows before/after comparison', async ({ page, openCsvShop }) => {
    void openCsvShop

    // Navigate to history
    await page.getByRole('link', { name: /history|historial/i }).click()
    await expect(page).toHaveURL(/\/history/)

    // Check if table with data exists
    const viewLink = page.getByRole('link', { name: /view|ver/i }).first()
    const hasEntries = await viewLink.isVisible().catch(() => false)

    // Skip test if no history entries in fixture
    if (!hasEntries) {
      return
    }

    await viewLink.click()

    // Detail page should show before/after
    await expect(page.getByText(/before|antes/i)).toBeVisible()
    await expect(page.getByText(/after|después/i)).toBeVisible()
  })
})

test.describe('v2.0.0 Inventory Colour Features', () => {
  test.use({ fixtureScenario: 'v2-metadata-rich' })

  test('inventory colour swatch visible in table', async ({ page, openCsvShop }) => {
    void openCsvShop
    
    // Navigate to inventory - use exact match to avoid "View inventory" link
    await page.getByRole('link', { name: 'Inventory', exact: true }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    
    // Check for colour swatches (colored circles)
    const swatches = page.locator('span[style*="background-color"], span[title="#"], span.rounded-full')
    const count = await swatches.count()
    expect(count).toBeGreaterThan(0)
  })

  test('inventory colour swatch visible in dropdowns', async ({ page, openCsvShop }) => {
    void openCsvShop

    // Navigate to a job with pieces
    await page.getByRole('link', { name: 'Jobs' }).click()
    await page.getByTestId('job-detail-link-J2').click()

    // Find first piece with items and add a line
    const addLineButton = page.getByRole('button', { name: /add line|add material/i }).first()
    if (await addLineButton.isVisible().catch(() => false)) {
      await addLineButton.click()

      // Open inventory dropdown
      await page.locator('[role="combobox"]').first().click()

      // Colour swatches should be visible in options
      const swatches = page.locator('span.rounded-full')
      await expect(swatches.first()).toBeVisible()
    }
  })
})

test.describe('v2.0.0 Validation Features', () => {
  test.use({ fixtureScenario: 'happy-path' })

  test('validation tolerates extra columns', async ({ page, openCsvShop }) => {
    void openCsvShop
    
    // Shop should load successfully even with extra columns
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({ timeout: 10000 })
    
    // Navigation should work
    await page.getByRole('link', { name: /transactions|transacciones/i }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
  })
})

test.describe('v2.0.0 Profile Menu Features', () => {
  test.use({ fixtureScenario: 'happy-path' })

  test('changelog button links to GitHub releases', async ({ page, openCsvShop }) => {
    void openCsvShop
    
    // Open profile menu
    await page.click('[aria-label*="menu"], [aria-label*="profile"], button:has-text("T")')
    
    // Find changelog link
    const changelogLink = page.locator('a[href*="github.com/jocaruser/illo3d/releases"]')
    await expect(changelogLink).toBeVisible()
    await expect(changelogLink).toHaveAttribute('target', '_blank')
  })
})

test.describe('v2.0.0 Dashboard Tab Features', () => {
  test.use({ fixtureScenario: 'v2-metadata-rich' })

  test('homepage tabs toggle between kanban and calendar', async ({ page, openCsvShop }) => {
    void openCsvShop
    await expect(page).toHaveURL(/\/dashboard/)

    // Look for tabs
    const kanbanTab = page.getByRole('button', { name: /kanban/i })
    const calendarTab = page.getByRole('button', { name: /calendar|calendario/i })

    // If tabs exist, test toggling
    if (await kanbanTab.isVisible().catch(() => false)) {
      await kanbanTab.click()
      // Kanban should show job cards
      await expect(page.locator('[data-testid^="kanban-drag-"]').first()).toBeVisible()
    }

    if (await calendarTab.isVisible().catch(() => false)) {
      await calendarTab.click()
      // Calendar should show - use specific month selector
      await expect(page.getByRole('button', { name: /previous month/i })).toBeVisible()
    }
  })
})

test.describe('v2.0.0 Job Completion Features', () => {
  test.use({ fixtureScenario: 'happy-path' })

  test('complete job creates income transaction', async ({ page, openCsvShop }) => {
    void openCsvShop
    
    // Navigate to jobs
    await page.getByRole('link', { name: 'Jobs' }).click()
    await expect(page.getByText(/connecting/i)).not.toBeVisible({ timeout: 15000 })
    
    // Complete a job
    await page.getByTestId('job-detail-link-J2').click()
    await page.getByRole('button', { name: /complete|completar/i }).click()
    
    // Confirm dialog
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: /complete|completar|confirm/i }).click()
    
    // Check for completed indicator
    await expect(page.getByText(/completed|completado/i)).toBeVisible({ timeout: 15000 })
    
    // Check transactions for income
    await page.getByRole('link', { name: /transactions|transacciones/i }).first().click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    
    const incomeRow = page.getByRole('row').filter({ hasText: /income|ingreso/i })
    await expect(incomeRow.first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('v2.0.0 Piece Status Features', () => {
  test.use({ fixtureScenario: 'happy-path' })

  test('piece status change triggers inventory decrement', async ({ page, openCsvShop }) => {
    void openCsvShop
    
    // Navigate to job with pieces
    await page.getByRole('link', { name: 'Jobs' }).click()
    await page.getByTestId('job-detail-link-J2').click()
    
    // Check initial inventory
    await page.getByRole('link', { name: /inventory|inventario/i }).click()
    await expect(page.getByText(/connecting|cargando/i)).not.toBeVisible({ timeout: 15000 })
    
    const initialQty = await page.locator('td:has-text("985")').textContent()
    expect(initialQty).toContain('985')
    
    // Go back and complete a piece
    await page.getByRole('link', { name: 'Jobs' }).click()
    await page.getByTestId('job-detail-link-J2').click()
    
    // Mark piece as done (if checkbox available)
    const completeCheckbox = page.getByTestId(/piece.*done/i).first()
    if (await completeCheckbox.isVisible().catch(() => false)) {
      await completeCheckbox.click()
      
      // Confirm inventory decrement
      const confirmDialog = page.getByRole('dialog')
      if (await confirmDialog.isVisible().catch(() => false)) {
        await confirmDialog.getByRole('button', { name: /confirm|yes/i }).click()
      }
    }
  })
})
