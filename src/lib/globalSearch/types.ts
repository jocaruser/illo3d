export type GlobalSearchEntityKind =
  | 'client'
  | 'job'
  | 'piece'
  | 'client_note'
  | 'job_note'
  | 'transaction'
  | 'expense'
  | 'inventory'
  | 'tag'

export interface GlobalSearchHit {
  kind: GlobalSearchEntityKind
  id: string
  navigateTo: string
  primaryLine: string
  secondaryLine?: string
  snippet?: string
}

export interface GlobalSearchRow {
  blob: string
  hit: GlobalSearchHit
  noteBody?: string
}

export type GlobalSearchTranslate = (
  key: string,
  options?: Record<string, unknown>
) => string
