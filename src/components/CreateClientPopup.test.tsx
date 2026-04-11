import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CreateClientPopup } from './CreateClientPopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockCreateClient = vi.fn()
vi.mock('@/services/client/createClient', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

describe('CreateClientPopup', () => {
  const onClose = vi.fn()
  const onSuccess = vi.fn()

  beforeEach(() => {
    mockCreateClient.mockReset()
    onClose.mockClear()
    onSuccess.mockClear()
  })

  it('renders nothing when isOpen is false', () => {
    render(
      <CreateClientPopup
        isOpen={false}
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    expect(screen.queryByText('clients.addClient')).not.toBeInTheDocument()
  })

  it('renders form when isOpen is true', () => {
    render(
      <CreateClientPopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    expect(screen.getByText('clients.addClient')).toBeInTheDocument()
    expect(screen.getByLabelText('clients.name')).toBeInTheDocument()
    expect(screen.getByText('clients.submit')).toBeInTheDocument()
  })

  it('shows validation error when name is empty', () => {
    render(
      <CreateClientPopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.click(screen.getByText('clients.submit'))

    expect(mockCreateClient).not.toHaveBeenCalled()
    expect(screen.getByText('clients.nameRequired')).toBeInTheDocument()
  })

  it('calls createClient and onSuccess when form is valid', async () => {
    mockCreateClient.mockResolvedValue(undefined)

    render(
      <CreateClientPopup
        isOpen
        onClose={onClose}
        onSuccess={onSuccess}
        spreadsheetId="spreadsheet-1"
      />
    )
    fireEvent.change(screen.getByLabelText('clients.name'), {
      target: { value: 'New Client' },
    })
    fireEvent.click(screen.getByText('clients.submit'))

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())

    expect(mockCreateClient).toHaveBeenCalledWith('spreadsheet-1', {
      name: 'New Client',
      email: undefined,
      phone: undefined,
      notes: undefined,
    })
    expect(onClose).toHaveBeenCalled()
  })
})
