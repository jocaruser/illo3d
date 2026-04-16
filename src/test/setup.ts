import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { clearTestPersistStorage } from '@/stores/persistStorage'
import { useAuthStore } from '@/stores/authStore'
import { useShopStore } from '@/stores/shopStore'

beforeEach(() => {
  clearTestPersistStorage()
  useShopStore.setState({ activeShop: null })
  useAuthStore.setState({
    user: null,
    credentials: null,
    isAuthenticated: false,
  })
})
