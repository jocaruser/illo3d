import { test, expect } from './fixtures'

test.describe('Shop logo', () => {
  test('displays shop logo in header when metadata has logo field', async ({ page, openCsvShop }) => {
    void openCsvShop

    // Wait for dashboard to be ready
    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })

    // Logo image should be visible in the header
    const logoImage = page.getByTestId('shop-logo')
    await expect(logoImage).toBeVisible()

    // Logo should have the correct attributes
    await expect(logoImage).toHaveAttribute('aria-hidden', 'true')

    // Logo height should be h-8 (32px)
    const logoBox = await logoImage.boundingBox()
    expect(logoBox?.height).toBe(32)
  })

  test('logo is positioned left of illo3d text', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })

    const logoImage = page.getByTestId('shop-logo')
    const illo3dText = page.locator('header').getByText('illo3d')

    await expect(logoImage).toBeVisible()
    await expect(illo3dText).toBeVisible()

    // Get bounding boxes to check relative positioning
    const logoBox = await logoImage.boundingBox()
    const textBox = await illo3dText.boundingBox()

    // Logo should be to the left of the text (smaller x coordinate)
    expect(logoBox && textBox && logoBox.x < textBox.x).toBe(true)
  })

  test('favicon is updated when shop loads', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })

    // Check that the favicon link exists and points to a blob URL or the logo
    const favicon = page.locator('link[rel="icon"]').first()
    await expect(favicon).toHaveAttribute('href', /^(blob:|.*logo\.svg)/)
  })

  test.describe('without logo in metadata', () => {
    test.use({ fixtureScenario: 'empty' })

    test('shows only illo3d text when no logo in metadata', async ({ page, openCsvShop }) => {
      void openCsvShop

      await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
        timeout: 20000,
      })

      // Should not have a logo image in the header
      const logoImage = page.getByTestId('shop-logo')
      await expect(logoImage).not.toBeVisible()

      // But should still have the illo3d text
      await expect(page.locator('header').getByText('illo3d')).toBeVisible()
    })

    test('uses default logo.svg as favicon when no shop logo', async ({ page, openCsvShop }) => {
      void openCsvShop

      await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
        timeout: 20000,
      })

      // Should fall back to default /logo.svg favicon
      const favicon = page.locator('link[rel="icon"]').first()
      await expect(favicon).toHaveAttribute('href', '/logo.svg')
    })
  })

  test('logo gracefully handles load error', async ({ page, openCsvShop }) => {
    void openCsvShop

    await expect(page.getByRole('heading', { name: /dashboard|panel/i })).toBeVisible({
      timeout: 20000,
    })

    const logoImage = page.getByTestId('shop-logo')
    await expect(logoImage).toBeVisible()

    // Verify the image loaded by checking naturalWidth > 0
    const naturalWidth = await logoImage.evaluate((img: HTMLImageElement) => img.naturalWidth)
    expect(naturalWidth).toBeGreaterThan(0)

    // A logo that fails to load hides itself instead of showing a broken glyph
    await logoImage.evaluate((img) => img.dispatchEvent(new Event('error')))
    await expect(logoImage).not.toBeVisible()
  })
})
