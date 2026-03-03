import fs from 'fs'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function loadSaCredentials(saFile: string): { clientEmail: string; privateKey: string } {
  if (!saFile) {
    return { clientEmail: '', privateKey: '' }
  }
  const resolved = path.resolve(process.cwd(), saFile)
  const content = fs.readFileSync(resolved, 'utf-8')
  const json = JSON.parse(content) as { client_email?: string; private_key?: string }
  return {
    clientEmail: json.client_email ?? '',
    privateKey: json.private_key ?? '',
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const { clientEmail, privateKey } = loadSaCredentials(
    env.VITE_SA_CREDENTIALS_FILE ?? ''
  )
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SA_CLIENT_EMAIL': JSON.stringify(clientEmail),
      'import.meta.env.VITE_SA_PRIVATE_KEY': JSON.stringify(privateKey),
      'import.meta.env.VITE_SA_FOLDER_ID': JSON.stringify(env.VITE_SA_FOLDER_ID),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: true,
    },
  }
})
