import { SHEET_HEADERS, SHEET_NAMES } from '@/Config/schema'
import { APP_VERSION, parseMajorVersion } from '@/Config/version'
import type { Shop, ShopMetadata } from '@/Entity/ShopMetadata'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'

export type ShopValidationResult =
  | { ok: true; shop: Shop; metadata: ShopMetadata }
  | { ok: false; error: 'not_shop' }
  /** Shop major behind the app's — the migration wizard's territory. */
  | { ok: false; error: 'version'; shopVersion: string; appVersion: string }
  /** Shop major ahead of the app's — only a newer app can open it. */
  | { ok: false; error: 'version_ahead'; shopVersion: string; appVersion: string }
  /** The recorded version is not a version at all. */
  | { ok: false; error: 'version_unreadable'; shopVersion: string }
  | { ok: false; error: 'structure'; detail: string }

export type StructureValidationResult = { ok: true } | { ok: false; detail: string }

/**
 * Validates that a folder is an openable illo3d shop: metadata present, major
 * version compatible, and the workbook structure matching the canonical schema.
 */
export class ShopValidationService {
  constructor(
    private readonly folderRepo: FolderRepositoryInterface,
    private readonly workbookRepo: WorkbookRepositoryInterface,
  ) {}

  async validateShopFolder(folderId: string): Promise<ShopValidationResult> {
    const metadata = await this.folderRepo.readMetadata(folderId)
    if (metadata === null) return { ok: false, error: 'not_shop' }

    const shopMajor = parseMajorVersion(metadata.version)
    const appMajor = parseMajorVersion(APP_VERSION)
    if (shopMajor === null || appMajor === null) {
      return {
        ok: false,
        error: 'version_unreadable',
        shopVersion: metadata.version,
      }
    }
    if (shopMajor > appMajor) {
      return {
        ok: false,
        error: 'version_ahead',
        shopVersion: metadata.version,
        appVersion: APP_VERSION,
      }
    }
    if (shopMajor < appMajor) {
      return {
        ok: false,
        error: 'version',
        shopVersion: metadata.version,
        appVersion: APP_VERSION,
      }
    }

    const structure = await this.validateStructure(metadata.spreadsheetId)
    if (!structure.ok) return { ok: false, error: 'structure', detail: structure.detail }

    const folderName = await this.folderRepo.getFolderName(folderId)
    return {
      ok: true,
      shop: {
        folderId,
        folderName,
        spreadsheetId: metadata.spreadsheetId,
        metadataVersion: metadata.version,
      },
      metadata,
    }
  }

  /** Every canonical sheet must exist with a header row equal to the canonical header. */
  async validateStructure(workbookId: string): Promise<StructureValidationResult> {
    const present = await this.workbookRepo.getSheetNames(workbookId)
    for (const sheet of SHEET_NAMES) {
      if (!present.includes(sheet)) {
        return { ok: false, detail: `missing sheet '${sheet}'` }
      }
      const header = await this.workbookRepo.getHeaderRow(workbookId, sheet)
      const canonical = SHEET_HEADERS[sheet]
      const width = Math.max(header.length, canonical.length)
      for (let index = 0; index < width; index += 1) {
        if ((header[index] ?? '') !== (canonical[index] ?? '')) {
          return {
            ok: false,
            detail: `sheet '${sheet}' column ${index + 1}: expected '${canonical[index] ?? ''}', found '${header[index] ?? ''}'`,
          }
        }
      }
    }
    return { ok: true }
  }
}
