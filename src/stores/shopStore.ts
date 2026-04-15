import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appPersistJSONStorage } from '@/stores/persistStorage'
import type { Shop } from '@/types/shop'

interface ShopState {
  activeShop: Shop | null
  setActiveShop: (shop: Shop) => void
  clearActiveShop: () => void
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
      storage: appPersistJSONStorage(),
    }
  )
)
