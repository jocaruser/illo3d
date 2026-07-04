import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import './i18n'
import './index.css'
import './styles/tokens.css'
import { registerGoogleOAuthClientId } from '@/services/google/accessToken'
import { initTheme } from '@/lib/theme/initTheme'

initTheme()

const queryClient = new QueryClient()
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
registerGoogleOAuthClientId(googleClientId)

export function AppRoot() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}

// Playwright E2E uses the Vite dev server; StrictMode's dev double-mount remounts
// the tree and can detach nodes mid-click (flaky in CI). Production builds omit it.
const isE2E = import.meta.env.VITE_E2E === 'true'
createRoot(document.getElementById('root')!).render(
  isE2E ? <AppRoot /> : <StrictMode><AppRoot /></StrictMode>,
)
