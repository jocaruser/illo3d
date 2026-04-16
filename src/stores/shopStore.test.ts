import { describe, it, expect, beforeEach } from 'vitest'
import { useShopStore } from './shopStore'

describe('shopStore', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    useShopStore.setState({ activeShop: null })
  })

  it('should start with no active shop', () => {
    const state = useShopStore.getState()
    expect(state.activeShop).toBeNull()
  })

  it('should set active shop', () => {
    const shop = {
      folderId: 'folder-1',
      folderName: 'My Shop',
      spreadsheetId: 'sheet-1',
      metadataVersion: '1.0.0',
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
      metadataVersion: '1.0.0',
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
      metadataVersion: '1.0.0',
    }
    useShopStore.getState().setActiveShop(shop)

    const persist =
      import.meta.env.PROD ? sessionStorage : localStorage
    const stored = persist.getItem('shop-storage')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!).state.activeShop).toEqual(shop)
  })
})
