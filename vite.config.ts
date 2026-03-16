import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sheetsAppendPlugin } from './vite-plugins/sheets-append'

export default defineConfig({
  plugins: [react(), sheetsAppendPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    host: true,
    allowedHosts: ['web'],
  },
})
