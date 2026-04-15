import { createJSONStorage } from 'zustand/middleware'

/**
 * Production builds use sessionStorage (cleared when the tab closes).
 * Dev / e2e use localStorage so Playwright `storageState` can restore persisted stores
 * (Playwright only saves cookies + localStorage, not sessionStorage).
 */
export function appPersistJSONStorage() {
  return createJSONStorage(() =>
    import.meta.env.PROD ? globalThis.sessionStorage : globalThis.localStorage
  )
}
