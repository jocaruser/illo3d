import { useEffect, useState } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { I18nextProvider } from 'react-i18next'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { routes } from '@/Config/routes'
import { useDirtyGuard } from '@/Hook/useDirtyGuard'
import { initI18n, readPersistedLanguage } from '@/I18n'
import { restoreDirectoryHandle } from '@/Repository/LocalCsv/persistDirectoryHandle'
import { useBackendStore } from '@/Store/backendStore'

declare global {
  interface ImportMetaEnv {
    /** Vite's public base path: `/` in dev, `/illo3d/` in production builds. */
    readonly BASE_URL: string
    /** `'true'` in Playwright runs; disables StrictMode's double render. */
    readonly VITE_E2E?: string
  }
}

/**
 * The application shell: providers, router and cross-cutting effects.
 *
 * A **hash** router is mandatory — GitHub Pages has no rewrite rules, so deep
 * links must live in the fragment (ARCHITECTURE.md, "Platform constraint").
 * There is no server cache to reconcile with either: the workbook snapshot in
 * `workbookStore` is the single source of truth, so no query client exists.
 */
export function Kernel() {
  const [i18n] = useState(() =>
    initI18n(readPersistedLanguage(window.localStorage))
  )
  const [router] = useState(() => createHashRouter(routes))

  useDirtyGuard()

  useEffect(() => {
    // The Local CSV handle outlives the tab in IndexedDB — the only store that
    // can hold it — so a reload resumes the shop without re-picking a folder.
    restoreDirectoryHandle()
      .then((handle) => {
        if (handle !== null)
          useBackendStore.getState().setLocalDirectoryHandle(handle)
      })
      .catch(() => {
        // A missing or unreadable handle just means the wizard asks again.
      })
  }, [])

  return (
    <I18nextProvider i18n={i18n}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </I18nextProvider>
  )
}
