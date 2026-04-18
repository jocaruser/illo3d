import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CreateConfirmModal } from './CreateConfirmModal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) => {
      if (key === 'wizard.createConfirmMessage' && opts?.name) {
        return `msg:${opts.name}`
      }
      return key
    },
  }),
}))

describe('CreateConfirmModal', () => {
  it('shows folder name in message', () => {
    render(
      <CreateConfirmModal
        folderDisplayName="My Shop Folder"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    )
    expect(screen.getByText('msg:My Shop Folder')).toBeInTheDocument()
  })

  it('fires onConfirm when create is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <CreateConfirmModal
        folderDisplayName="X"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByTestId('wizard-create-confirm-action'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('fires onCancel when cancel is clicked', () => {
    const onCancel = vi.fn()
    render(
      <CreateConfirmModal folderDisplayName="X" onConfirm={vi.fn()} onCancel={onCancel} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'wizard.createConfirmCancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
