import type { Plugin } from 'vite'

/**
 * Extends the CSP `connect-src` directive in `index.html` with the origins
 * of any `VITE_GOOGLE_*_API_BASE` overrides (e.g. a local
 * google-drive-api-mock instance), derived from the same env vars
 * `GoogleApiClient.ts` reads — one source of truth, so CSP can never drift
 * from what the app actually fetches. Production defines no overrides, so
 * the shipped CSP is byte-identical to the real-Google-only baseline.
 */
export function cspConnectSrcPlugin(): Plugin {
  return {
    name: 'illo3d-csp-connect-src',
    transformIndexHtml(html) {
      // Checked on every build, including production (no overrides): a
      // future CSP edit that silently drops this marker would otherwise go
      // unnoticed until someone happens to run with an override set.
      const marker = "connect-src 'self' https://sheets.googleapis.com https://www.googleapis.com"
      if (!html.includes(marker)) {
        throw new Error(
          "illo3d-csp-connect-src: expected CSP connect-src marker not found in index.html — update this plugin alongside any CSP edit."
        )
      }

      const overrides = [
        process.env.VITE_GOOGLE_DRIVE_API_BASE,
        process.env.VITE_GOOGLE_DRIVE_UPLOAD_API_BASE,
        process.env.VITE_GOOGLE_SHEETS_API_BASE,
      ].filter((value): value is string => value !== undefined && value !== '')
      if (overrides.length === 0) return html

      const origins = [
        ...new Set(
          overrides.map((url) => {
            let origin: string
            try {
              origin = new URL(url).origin
            } catch {
              throw new Error(
                `illo3d-csp-connect-src: VITE_GOOGLE_*_API_BASE override is not a valid absolute URL: ${url}`
              )
            }
            // A relative/schemeless value (e.g. a missing "http://") parses
            // without throwing but yields the literal origin "null", which
            // would silently ship a useless CSP source instead of failing.
            if (origin === 'null') {
              throw new Error(
                `illo3d-csp-connect-src: VITE_GOOGLE_*_API_BASE override has no scheme/host: ${url}`
              )
            }
            return origin
          })
        ),
      ]
      return html.replace(marker, `${marker} ${origins.join(' ')}`)
    },
  }
}
