import * as fs from 'node:fs'
import * as path from 'node:path'
import { DriveStore } from 'google-drive-api-mock'

export interface FakeGoogleMount {
  store: DriveStore
  /** Disk root of the emulated Drive: seed files into it, assert files out of it. */
  rootDir: string
}

/**
 * The e2e app talks to the live `google-mock` compose service (the e2e Vite
 * build carries `VITE_GOOGLE_*_API_BASE=http://google-mock:8790/…`), so the
 * full production stack — repositories, GoogleApiClient, authorizedFetch,
 * real CORS preflights — runs against a real HTTP server. This helper owns
 * the shared data directory both sides see: it resets the world per test and
 * hands back a seeding store (the running server picks up external writes;
 * see the emulator's disk-state spec). Sequential workers only.
 *
 * Clears the directory's *contents*, never the directory inode itself —
 * unlike `copyGoldenFixtureToE2eRoot`'s rm-rf+mkdir for `.e2e-fixtures`
 * (fixtures.ts), which is safe because only this single container ever
 * touches that tree. `google-mock` bind-mounts THIS host path from a
 * second, already-running container, and deleting+recreating the directory
 * out from under an already-mounted container can leave that container's
 * view of the path stale (observed as indefinitely hanging requests
 * against a Docker Desktop/WSL2 bind mount).
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
