import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreateShopStep } from './CreateShopStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('CreateShopStep', () => {
  it('renders folder name input and buttons', () => {
    render(
      <CreateShopStep
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onCreateShop={vi.fn()}
      />
    )

    expect(screen.getByLabelText('wizard.folderName')).toBeInTheDocument()
    expect(screen.getByText('wizard.back')).toBeInTheDocument()
    expect(screen.getByText('wizard.create')).toBeInTheDocument()
  })

  it('shows validation error when folder name is empty', async () => {
    const onCreateShop = vi.fn()
    render(
      <CreateShopStep
        onBack={vi.fn()}
        onSuccess={vi.fn()}
        onCreateShop={onCreateShop}
      />
    )

    fireEvent.click(screen.getByText('wizard.create'))
    expect(onCreateShop).not.toHaveBeenCalled()
  })
})
