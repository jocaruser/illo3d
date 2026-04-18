import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GoogleDriveStep } from './GoogleDriveStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const user = { email: 'u@example.com', name: 'User One', picture: 'https://example.com/p.png' }

describe('GoogleDriveStep', () => {
  it('renders user name and fires create, open picker, open by id, and cancel', () => {
    const onCreate = vi.fn()
    const onOpen = vi.fn()
    const onId = vi.fn()
    const onCancel = vi.fn()
    render(
      <GoogleDriveStep
        user={user}
        loading={false}
        error={null}
        onCreateNew={onCreate}
        onOpenExisting={onOpen}
        onOpenByFolderId={onId}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByText('User One')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'User One' })).toHaveAttribute('src', user.picture)

    fireEvent.click(screen.getByTestId('wizard-google-create'))
    expect(onCreate).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('wizard-google-open-picker'))
    expect(onOpen).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('wizard-google-open-by-id'))
    expect(onId).not.toHaveBeenCalled()

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc123' } })
    fireEvent.click(screen.getByTestId('wizard-google-open-by-id'))
    expect(onId).toHaveBeenCalledWith('abc123')

    fireEvent.click(screen.getByTestId('wizard-google-cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
