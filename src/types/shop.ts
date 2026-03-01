export interface Shop {
  folderId: string
  folderName: string
  spreadsheetId: string
  metadataVersion: string
}

export interface ShopMetadata {
  app: string
  version: string
  spreadsheetId: string
  createdAt: string
  createdBy: string
}
