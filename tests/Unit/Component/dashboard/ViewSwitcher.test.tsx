import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ViewSwitcher } from '@/Component/dashboard/ViewSwitcher'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('ViewSwitcher', () => {
  it('marks the current view as the selected tab', () => {
    renderWithProviders(<ViewSwitcher view="kanban" onChange={vi.fn()} />)

    expect(screen.getByRole('tablist', { name: 'Dashboard view' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Kanban' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'false')
  })

  it('reflects the calendar view', () => {
    renderWithProviders(<ViewSwitcher view="calendar" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true')
  })

  it('reports the view the user picked', async () => {
    const onChange = vi.fn()
    renderWithProviders(<ViewSwitcher view="kanban" onChange={onChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Calendar' }))

    expect(onChange).toHaveBeenCalledWith('calendar')
  })
})
