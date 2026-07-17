import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fixturesRootPlugin } from './vite-plugins/fixtures-root'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/illo3d/' : '/',
  plugins: [fixturesRootPlugin(), react()],
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
    host: true,
    allowedHosts: ['web'],
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
}))
