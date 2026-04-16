import { describe, it, expect } from 'vitest'
import { readTestPersistEntry } from './persistStorage'
import { useShopStore } from './shopStore'

describe('shopStore', () => {
  it('should start with no active shop', () => {
    const state = useShopStore.getState()
    expect(state.activeShop).toBeNull()
  })

  it('should set active shop', () => {
    const shop = {
      folderId: 'folder-1',
      folderName: 'My Shop',
      spreadsheetId: 'sheet-1',
      metadataVersion: '2.0.0',
    }
    useShopStore.getState().setActiveShop(shop)

    const state = useShopStore.getState()
    expect(state.activeShop).toEqual(shop)
  })

  it('should clear active shop', () => {
    const shop = {
      folderId: 'folder-1',
      folderName: 'My Shop',
      spreadsheetId: 'sheet-1',
      metadataVersion: '2.0.0',
    }
    useShopStore.getState().setActiveShop(shop)
    useShopStore.getState().clearActiveShop()

    const state = useShopStore.getState()
    expect(state.activeShop).toBeNull()
  })

  it('should persist active shop', () => {
    const shop = {
      folderId: 'folder-1',
      folderName: 'My Shop',
      spreadsheetId: 'sheet-1',
      metadataVersion: '2.0.0',
    }
    useShopStore.getState().setActiveShop(shop)

    const stored = readTestPersistEntry('shop-storage')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!).state.activeShop).toEqual(shop)
  })
})
