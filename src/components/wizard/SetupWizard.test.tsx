import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SetupWizard } from './SetupWizard'

const pickFolder = vi.fn()
const mockGoogleLogin = vi.fn()

type OneTapOpts = {
  disabled?: boolean
  onSuccess?: (r: { credential?: string }) => void
}
let lastOneTap: OneTapOpts = {}

vi.mock('@react-oauth/google', () => ({
  useGoogleLogin: () => mockGoogleLogin,
  useGoogleOneTapLogin: (opts: OneTapOpts) => {
    lastOneTap = opts
  },
}))

vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ email: 'one-tap@example.com' }),
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
  beforeEach(() => {
    pickFolder.mockReset()
    mockGoogleLogin.mockReset()
    lastOneTap = {}
  })

  it('shows welcome step by default', async () => {
    render(<SetupWizard onCancel={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
    })
    expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()
    expect(lastOneTap.disabled).toBe(true)
  })

  it('enables One Tap after Google Drive is chosen and opens OAuth from One Tap success', async () => {
    render(<SetupWizard onCancel={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('wizard-google-drive'))
    expect(mockGoogleLogin).not.toHaveBeenCalled()
    expect(lastOneTap.disabled).toBe(false)

    lastOneTap.onSuccess?.({ credential: 'fake-jwt' })
    expect(mockGoogleLogin).toHaveBeenCalledWith({ hint: 'one-tap@example.com' })
  })

  it('second Google Drive click triggers OAuth without One Tap', async () => {
    render(<SetupWizard onCancel={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByTestId('wizard-google-drive')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('wizard-google-drive'))
    fireEvent.click(screen.getByTestId('wizard-google-drive'))
    expect(mockGoogleLogin).toHaveBeenCalledTimes(1)
    expect(mockGoogleLogin.mock.calls[0]).toEqual([])
  })

  it('does not run OAuth when One Tap succeeds after local path was chosen', async () => {
    pickFolder.mockResolvedValue(null)
    render(<SetupWizard onCancel={vi.fn()} />)
    await waitFor(() => {
      expect(screen.getByTestId('wizard-local-folder')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('wizard-local-folder'))
    await waitFor(() => {
      expect(pickFolder).toHaveBeenCalled()
    })

    lastOneTap.onSuccess?.({ credential: 'fake-jwt' })
    expect(mockGoogleLogin).not.toHaveBeenCalled()
  })
})
