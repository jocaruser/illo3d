import { describe, expect, it, vi } from 'vitest'
import { APP_VERSION } from '@/Config/version'
import type { FolderRepositoryInterface } from '@/Repository/FolderRepositoryInterface'
import type { WorkbookRepositoryInterface } from '@/Repository/WorkbookRepositoryInterface'
import { ShopProvisioningService } from '@/Service/ShopProvisioningService'
import { FixedClock } from './helpers'

describe('createShop', () => {
  it('creates the workbook, writes metadata and returns the shop', async () => {
    const folderRepo: FolderRepositoryInterface = {
      readMetadata: vi.fn(async () => null),
      writeMetadata: vi.fn(async () => {}),
      getFolderName: vi.fn(async () => 'unused'),
    }
    const workbookRepo = {
      createWorkbook: vi.fn(async () => 'wb-77'),
    } as unknown as WorkbookRepositoryInterface

    const service = new ShopProvisioningService(
      folderRepo,
      workbookRepo,
      new FixedClock('2026-07-16T10:00:00.000Z'),
      'folder-9',
      'New Shop',
    )
    const shop = await service.createShop('user@example.com')

    expect(workbookRepo.createWorkbook).toHaveBeenCalledTimes(1)
    expect(folderRepo.writeMetadata).toHaveBeenCalledWith('folder-9', {
      app: 'illo3d',
      version: APP_VERSION,
      spreadsheetId: 'wb-77',
      createdAt: '2026-07-16T10:00:00.000Z',
      createdBy: 'user@example.com',
    })
    expect(shop).toEqual({
      folderId: 'folder-9',
      folderName: 'New Shop',
      spreadsheetId: 'wb-77',
      metadataVersion: APP_VERSION,
    })
  })
})
