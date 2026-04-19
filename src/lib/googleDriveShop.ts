import type { Backend } from '@/stores/backendStore'
import type { Shop } from '@/types/shop'

/**
 * Whether persisted shop data refers to a Google Drive shop (not local CSV / fixtures).
 * Used when `backend` was lost from memory (e.g. before backend was persisted) or is null.
 */
export function isGoogleDriveStyleShop(backend: Backend | null, shop: Shop | null): boolean {
  if (!shop?.folderId) return false
  if (backend === 'local-csv') return false
  const sid = shop.spreadsheetId
  if (sid.startsWith('local-')) return false
  if (sid.startsWith('csv-fixture-')) return false
  return true
}
