import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fixturesRootPlugin } from './vite-plugins/fixtures-root'
import { sheetsAppendPlugin } from './vite-plugins/sheets-append'

export default defineConfig({
  plugins: [fixturesRootPlugin(), react(), sheetsAppendPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
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
})
