import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChooseActionStep } from './ChooseActionStep'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('ChooseActionStep', () => {
  it('renders create new and open existing buttons', () => {
    const onCreateNew = vi.fn()
    const onOpenExisting = vi.fn()
    const onCancel = vi.fn()

    render(
      <ChooseActionStep
        onCreateNew={onCreateNew}
        onOpenExisting={onOpenExisting}
        onCancel={onCancel}
      />
    )

    expect(screen.getByText('wizard.createNew')).toBeInTheDocument()
    expect(screen.getByText('wizard.openExisting')).toBeInTheDocument()
    expect(screen.getByText('wizard.cancel')).toBeInTheDocument()
  })

  it('calls onCreateNew when create button is clicked', () => {
    const onCreateNew = vi.fn()
    render(
      <ChooseActionStep
        onCreateNew={onCreateNew}
        onOpenExisting={vi.fn()}
        onCancel={vi.fn()}
      />
    )

    fireEvent.click(screen.getByText('wizard.createNew'))
    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = vi.fn()
    render(
      <ChooseActionStep
        onCreateNew={vi.fn()}
        onOpenExisting={vi.fn()}
        onCancel={onCancel}
      />
    )

    fireEvent.click(screen.getByText('wizard.cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
