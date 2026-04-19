import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fixturesRootPlugin } from './vite-plugins/fixtures-root'
import { sheetsAppendPlugin } from './vite-plugins/sheets-append'

function sanitizeFixtureFolderId(folderId: string): string | null {
  return /^[a-zA-Z0-9_-]+$/.test(folderId) ? folderId : null
}

function resolveLocalCsvFixtureFolder(mode: string): string {
  const loaded = loadEnv(mode, process.cwd(), '')
  const fromEnv =
    loaded.VITE_LOCAL_CSV_FIXTURE_FOLDER ?? process.env.VITE_LOCAL_CSV_FIXTURE_FOLDER
  const sanitized =
    typeof fromEnv === 'string' ? sanitizeFixtureFolderId(fromEnv.trim()) : null
  if (sanitized) return sanitized
  const useDevDefault = mode === 'development' || mode === 'test'
  return useDevDefault ? 'happy-path' : ''
}

export default defineConfig(({ mode }) => ({
  plugins: [fixturesRootPlugin(), react(), sheetsAppendPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  define: {
    'import.meta.env.VITE_LOCAL_CSV_FIXTURE_FOLDER': JSON.stringify(
      resolveLocalCsvFixtureFolder(mode),
    ),
  },
  server: {
    host: true,
    allowedHosts: ['web'],
    // Google Identity Services popup OAuth: default COOP can block window.closed (see react-oauth README).
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
}))
