import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/Theme/index.css'
import { Kernel } from '@/Kernel'
import { initTheme } from '@/Theme/initTheme'

// Before the first paint: the theme comes from the bundle, never an inline
// script, because the CSP forbids `'unsafe-inline'` (ARCHITECTURE.md).
initTheme()

const container = document.getElementById('root')
if (container === null) throw new Error('Missing #root container')

createRoot(container).render(
  // StrictMode double-invokes effects, which makes Playwright races flaky.
  import.meta.env.VITE_E2E === 'true' ? (
    <Kernel />
  ) : (
    <StrictMode>
      <Kernel />
    </StrictMode>
  )
)
