import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Shop } from '@/Entity/ShopMetadata'
import { appStorage } from '@/Store/persistStorage'

/**
 * The active shop, persisted to `localStorage` (folder/spreadsheet ids are
 * not secret) so a returning user lands straight in their shop instead of
 * re-running the wizard — see ARCHITECTURE.md, "Client-side persistence".
 */
interface ShopState {
  activeShop: Shop | null
  setActiveShop(shop: Shop): void
  clearActiveShop(): void
}

export const useShopStore = create<ShopState>()(
  persist(
    (set) => ({
      activeShop: null,

      setActiveShop: (shop) => set({ activeShop: shop }),

      clearActiveShop: () => set({ activeShop: null }),
    }),
    {
      name: 'shop-storage',
      storage: createJSONStorage(appStorage),
      partialize: (state) => ({ activeShop: state.activeShop }),
    }
  )
)
