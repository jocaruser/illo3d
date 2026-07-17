/**
 * Contents of `illo3d.metadata.json` inside every shop folder.
 * `version`'s major segment gates compatibility (see src/Config/version.ts);
 * the migration wizard upgrades incompatible shops.
 */
export interface ShopMetadata {
  app: 'illo3d'
  version: string
  spreadsheetId: string
  createdAt: string
  createdBy: string
  /** Optional logo file name, relative to the shop folder. */
  logo?: string
  /** Optional avatar image file name for the local profile menu. */
  iconsrc?: string
  /** Optional display name for local-backend users. */
  userName?: string
  kanban?: {
    /** Days after which paid/cancelled cards leave the kanban (default 5). */
    autoCardsHideAfterXDays?: number
  }
  /** Default days-from-now used to prefill a new job's due date. */
  defaultDueDate?: number
}

export function isShopMetadata(value: unknown): value is ShopMetadata {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    candidate.app === 'illo3d' &&
    typeof candidate.version === 'string' &&
    typeof candidate.spreadsheetId === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.createdBy === 'string'
  )
}

/** The active shop as persisted in the shop store (sessionStorage). */
export interface Shop {
  folderId: string
  folderName: string
  spreadsheetId: string
  metadataVersion: string
}
