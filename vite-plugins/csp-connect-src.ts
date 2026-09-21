import type { Plugin, ResolvedConfig } from 'vite'
import { loadEnv } from 'vite'

const CSP_MARKER =
  "connect-src 'self' https://sheets.googleapis.com https://www.googleapis.com"

const GOOGLE_API_BASE_ENV_VARS = [
  'VITE_GOOGLE_DRIVE_API_BASE',
  'VITE_GOOGLE_DRIVE_UPLOAD_API_BASE',
  'VITE_GOOGLE_SHEETS_API_BASE',
] as const

function originOf(value: string): string {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(
      `csp-connect-src: '${value}' is not a valid URL for a Google API base override`
    )
  }
  if (url.origin === 'null') {
    throw new Error(
      `csp-connect-src: '${value}' has no scheme/host origin to add to the CSP`
    )
  }
  return url.origin
}

/**
 * Extends index.html's CSP `connect-src` with the origin of any Google API
 * base override — the same three env vars `GoogleApiClient.ts` reads, so the
 * CSP can never drift from what the app actually fetches. Production sets no
 * overrides, so this is a no-op there. Asserts the marker is present so a
 * future CSP edit that removes it fails the build instead of silently
 * scoping this plugin to nothing.
 */
export function cspConnectSrcPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'illo3d-csp-connect-src',
    configResolved(resolved) {
      config = resolved
    },
    transformIndexHtml(html) {
      if (!html.includes(CSP_MARKER)) {
        throw new Error(
          `csp-connect-src: expected CSP marker not found in index.html: '${CSP_MARKER}'`
        )
      }
      const env = loadEnv(config.mode, config.envDir, '')
      const origins = new Set<string>()
      for (const name of GOOGLE_API_BASE_ENV_VARS) {
        const value = env[name]?.trim()
        if (value) origins.add(originOf(value))
      }
      if (origins.size === 0) return html
      return html.replace(CSP_MARKER, `${CSP_MARKER} ${[...origins].join(' ')}`)
    },
  }
}
