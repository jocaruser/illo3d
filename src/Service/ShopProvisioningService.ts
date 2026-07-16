import { APP_VERSION } from '@/Config/version'
import type { Shop, ShopMetadata } from '@/Entity/ShopMetadata'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'
import { isoInstant, type Clock } from './Clock'

/**
 * Creates a brand-new shop inside an existing folder: workbook with every
 * canonical sheet plus `illo3d.metadata.json`. Backend-agnostic — the caller
 * injects repositories already bound to the target folder (for Google Drive
 * the wizard creates the folder first).
 */
export class ShopProvisioningService {
  constructor(
    private readonly folderRepo: FolderRepositoryInterface,
    private readonly workbookRepo: WorkbookRepositoryInterface,
    private readonly clock: Clock,
    private readonly folderId: string,
    private readonly folderName: string,
  ) {}

  async createShop(createdBy: string): Promise<Shop> {
    const spreadsheetId = await this.workbookRepo.createWorkbook()
    const metadata: ShopMetadata = {
      app: 'illo3d',
      version: APP_VERSION,
      spreadsheetId,
      createdAt: isoInstant(this.clock),
      createdBy,
    }
    await this.folderRepo.writeMetadata(this.folderId, metadata)
    return {
      folderId: this.folderId,
      folderName: this.folderName,
      spreadsheetId,
      metadataVersion: APP_VERSION,
    }
  }
}
