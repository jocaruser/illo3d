import path from 'path'
import { loadEnv } from 'vite'
import type { ResolvedConfig } from 'vite'

/**
 * Root directory containing per-shop folders (e.g. happy-path/).
 * Must match for GET /fixtures/* (fixtures-root plugin) and PUT /api/sheets/row (sheets-append).
 * Uses loadEnv so .env / .env.local match Vite config and client env.
 */
export function getFixturesRootDir(config: ResolvedConfig): string {
  const env = loadEnv(config.mode, config.envDir, '')
  const raw = env.VITE_FIXTURES_ROOT?.trim()
  if (raw) {
    return path.resolve(config.root, raw)
  }
  return path.resolve(config.root, 'public/fixtures')
}
