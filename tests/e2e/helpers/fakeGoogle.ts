import * as path from 'node:path'
import { test, type Page } from '@playwright/test'
import {
  createFakeGoogle,
  type DriveStoreOptions,
  type FakeGoogle,
} from 'google-drive-api-mock'

export interface FakeGoogleMount extends FakeGoogle {
  /** Disk root of the emulated Drive: seed files into it, assert files out of it. */
  rootDir: string
}

/** The data-plane hosts the emulator owns; OAuth/userinfo stay with mockGoogleOAuth. */
function isEmulatedUrl(url: URL): boolean {
  if (url.hostname === 'sheets.googleapis.com') return true
  if (url.hostname !== 'www.googleapis.com') return false
  return (
    url.pathname.startsWith('/drive/v3/') ||
    url.pathname.startsWith('/upload/drive/')
  )
}

/**
 * Mounts the google-drive-api-mock emulator behind `page.route`, rooted (by
 * default) in this test's Playwright output dir. The full prod stack —
 * repositories, GoogleApiClient, authorizedFetch — runs unchanged; only the
 * network edge is redirected into the emulator, whose state is plain files.
 */
export async function mountFakeGoogle(
  page: Page,
  options: Partial<DriveStoreOptions> = {}
): Promise<FakeGoogleMount> {
  const rootDir =
    options.rootDir ?? path.join(test.info().outputDir, 'fake-google')
  const fake = createFakeGoogle({ ...options, rootDir })

  await page.route(isEmulatedUrl, async (route) => {
    const request = route.request()
    const body = request.postDataBuffer()
    const response = await fake.handle(
      new Request(request.url(), {
        method: request.method(),
        headers: request.headers(),
        ...(body === null ? {} : { body: new Uint8Array(body) }),
      })
    )
    const headers: Record<string, string> = {}
    response.headers.forEach((value, name) => {
      headers[name] = value
    })
    await route.fulfill({
      status: response.status,
      headers,
      body: Buffer.from(await response.arrayBuffer()),
    })
  })

  return { ...fake, rootDir }
}
