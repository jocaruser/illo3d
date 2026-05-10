export interface Shop {
  folderId: string
  folderName: string
  spreadsheetId: string
  metadataVersion: string
}

export interface KanbanColumn {
  name: string
  color: string
}

export interface HomepageView {
  type: 'kanban' | 'calendar'
  column: string
  days: number
}

export interface ShopMetadata {
  app: string
  version: string
  spreadsheetId: string
  createdAt: string
  createdBy: string
  iconsrc?: string
  userName?: string
  logo?: string
  kanbanColumns?: KanbanColumn[]
  completedStatusLabel?: string
  defaultDueDate?: number
  homepageViews?: HomepageView[]
}
