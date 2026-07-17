import { screen } from '@testing-library/react'
import { ListTablePageHeader } from '@/Component/layout/ListTablePageHeader'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('ListTablePageHeader', () => {
  it('renders the display-font title and stacks below sm', () => {
    renderWithProviders(<ListTablePageHeader title="Clients" />)

    const heading = screen.getByRole('heading', { level: 1, name: 'Clients' })
    expect(heading).toHaveClass('font-display')
    expect(heading.parentElement).toHaveClass('flex-col', 'sm:flex-row')
  })

  it('gives the search slot flexible width', () => {
    renderWithProviders(
      <ListTablePageHeader title="Jobs" search={<input aria-label="Search" />} />
    )

    expect(screen.getByLabelText('Search').parentElement).toHaveClass('flex-1', 'min-w-[12rem]')
  })

  it('renders the actions slot', () => {
    renderWithProviders(
      <ListTablePageHeader title="Jobs" actions={<button type="button">Add job</button>} />
    )

    expect(screen.getByRole('button', { name: 'Add job' })).toBeInTheDocument()
  })
})
