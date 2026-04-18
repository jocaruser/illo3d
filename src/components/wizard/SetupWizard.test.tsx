import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SetupWizard } from './SetupWizard'

const pickFolder = vi.fn()

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => vi.fn(),
}))

vi.mock('@/hooks/useLocalFolderDetection', () => ({
  useLocalFolderDetection: () => ({ pickFolder }),
}))

vi.mock('@/hooks/useCreateShop', () => ({
  useCreateShop: () => ({
    createShop: vi.fn(),
    createShopInLocalFolder: vi.fn(),
  }),
}))

vi.mock('@/hooks/useOpenExistingShop', () => ({
  useOpenExistingShop: () => ({
    selectFolder: vi.fn(),
    validateAndSetShop: vi.fn(),
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('SetupWizard', () => {
  it('shows welcome step by default', async () => {
    pickFolder.mockReset()
    render(<SetupWizard onCancel={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
    })
    expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()
  })
})
