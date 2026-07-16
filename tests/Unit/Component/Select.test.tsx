import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Select } from '@/Component/Select'
import { renderWithProviders } from './helpers/renderWithProviders'

const options = [
  { value: 'draft', label: 'Draft' },
  { value: 'paid', label: 'Paid' },
]

describe('Select', () => {
  it('renders options with dark-ready control classes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Select aria-label="Status" options={options} defaultValue="draft" />)

    const select = screen.getByLabelText('Status')
    expect(select).toHaveClass('bg-surface-elevated', 'text-text', 'border-border')
    expect(screen.getAllByRole('option')).toHaveLength(2)

    await user.selectOptions(select, 'paid')
    expect(select).toHaveValue('paid')
  })

  it('renders the placeholder as a first empty option', () => {
    renderWithProviders(
      <Select aria-label="Status" options={options} placeholder="Pick one" defaultValue="" />
    )

    const rendered = screen.getAllByRole('option')
    expect(rendered).toHaveLength(3)
    expect(rendered[0]).toHaveTextContent('Pick one')
    expect(rendered[0]).toHaveValue('')
    expect(screen.getByLabelText('Status')).toHaveValue('')
  })
})
