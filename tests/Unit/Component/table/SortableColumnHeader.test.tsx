import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SortableColumnHeader } from '@/Component/table/SortableColumnHeader'
import { renderWithProviders } from '../helpers/renderWithProviders'

function renderHeader(direction: 'asc' | 'desc' | null, onToggle = vi.fn()) {
  renderWithProviders(
    <table>
      <thead>
        <tr>
          <SortableColumnHeader label="Name" direction={direction} onToggle={onToggle} />
        </tr>
      </thead>
    </table>
  )
  return onToggle
}

describe('SortableColumnHeader', () => {
  it('is unsorted by default and toggles to ascending', async () => {
    const user = userEvent.setup()
    const onToggle = renderHeader(null)

    const header = screen.getByRole('columnheader')
    expect(header).not.toHaveAttribute('aria-sort')

    await user.click(screen.getByRole('button', { name: 'Sort by Name' }))
    expect(onToggle).toHaveBeenCalledWith('asc')
  })

  it('announces ascending and toggles to descending', async () => {
    const user = userEvent.setup()
    const onToggle = renderHeader('asc')

    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'ascending')

    await user.click(screen.getByRole('button', { name: 'Name, sorted ascending' }))
    expect(onToggle).toHaveBeenCalledWith('desc')
  })

  it('announces descending and toggles back to ascending', async () => {
    const user = userEvent.setup()
    const onToggle = renderHeader('desc')

    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending')

    await user.click(screen.getByRole('button', { name: 'Name, sorted descending' }))
    expect(onToggle).toHaveBeenCalledWith('asc')
  })
})
