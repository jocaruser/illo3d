import * as fs from 'node:fs'
import * as path from 'node:path'
import { DriveStore } from 'google-drive-api-mock'

/** A `DriveStore` mounted on the shared data directory the live `google-mock` container also mounts. */
export interface FakeGoogleMount {
  store: DriveStore
  rootDir: string
}

/**
 * Reset the shared e2e Google-mock data directory and return a fresh
 * `DriveStore` mounted on it. Clears the directory's *contents*, never the
 * directory inode itself: `google-mock` bind-mounts the same host path from
 * an already-running container, and deleting/recreating the directory can
 * leave that container's view of the path stale (Docker Desktop/WSL2).
 */
export function resetGoogleMock(): FakeGoogleMount {
  const rootDir = path.resolve(
    process.cwd(),
    process.env.E2E_GOOGLE_MOCK_DATA_DIR ?? '.e2e-google-mock'
  )
  fs.mkdirSync(rootDir, { recursive: true })
  for (const entry of fs.readdirSync(rootDir)) {
    fs.rmSync(path.join(rootDir, entry), { recursive: true, force: true })
  }
  return { store: new DriveStore({ rootDir }), rootDir }
}
