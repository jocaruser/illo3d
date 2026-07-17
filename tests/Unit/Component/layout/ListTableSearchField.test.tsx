import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ListTableSearchField } from '@/Component/layout/ListTableSearchField'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('ListTableSearchField', () => {
  it('labels the input with an sr-only label and no aria-label', () => {
    renderWithProviders(<ListTableSearchField value="" onChange={vi.fn()} />)

    const input = screen.getByLabelText('Search this list')
    expect(input).not.toHaveAttribute('aria-label')
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('placeholder', 'Search…')
    expect(screen.getByText('Search this list')).toHaveClass('sr-only')
  })

  it('supports a custom placeholder', () => {
    renderWithProviders(
      <ListTableSearchField value="" onChange={vi.fn()} placeholder="Filter jobs" />
    )
    expect(screen.getByLabelText('Search this list')).toHaveAttribute('placeholder', 'Filter jobs')
  })

  it('reports typed values', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<ListTableSearchField value="" onChange={onChange} />)

    await user.type(screen.getByLabelText('Search this list'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })
})
