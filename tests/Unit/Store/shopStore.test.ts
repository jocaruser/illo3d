import type { Shop } from '@/Entity/ShopMetadata'
import { installFakeLocalStorage } from './memoryLocalStorage'

const shop: Shop = {
  folderId: 'folder-1',
  folderName: 'My 3D Shop',
  spreadsheetId: 'sheet-1',
  metadataVersion: '3.0.0',
}

async function freshShopStore() {
  vi.resetModules()
  const { useShopStore } = await import('@/Store/shopStore')
  return useShopStore
}

function persistedState(): Record<string, unknown> {
  const raw = localStorage.getItem('shop-storage')
  expect(raw).not.toBeNull()
  return (JSON.parse(raw as string) as { state: Record<string, unknown> }).state
}

describe('useShopStore', () => {
  beforeEach(() => {
    installFakeLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts with no active shop', async () => {
    const useShopStore = await freshShopStore()

    expect(useShopStore.getState().activeShop).toBeNull()
  })

  it('setActiveShop stores and persists the shop', async () => {
    const useShopStore = await freshShopStore()

    useShopStore.getState().setActiveShop(shop)

    expect(useShopStore.getState().activeShop).toEqual(shop)
    expect(persistedState()).toEqual({ activeShop: shop })
  })

  it('clearActiveShop clears memory and storage', async () => {
    const useShopStore = await freshShopStore()
    useShopStore.getState().setActiveShop(shop)

    useShopStore.getState().clearActiveShop()

    expect(useShopStore.getState().activeShop).toBeNull()
    expect(persistedState()).toEqual({ activeShop: null })
  })

  it('rehydrates the active shop from storage so reloads land in the shop', async () => {
    localStorage.setItem(
      'shop-storage',
      JSON.stringify({ state: { activeShop: shop }, version: 0 })
    )

    const useShopStore = await freshShopStore()

    expect(useShopStore.getState().activeShop).toEqual(shop)
  })
})
