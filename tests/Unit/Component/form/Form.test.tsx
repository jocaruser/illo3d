import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { FormSelect } from '@/Component/form/FormSelect'
import { FormTextarea } from '@/Component/form/FormTextarea'
import { RequiredIndicator } from '@/Component/form/RequiredIndicator'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('form primitives', () => {
  it('renders a wired group with label, input, and required indicator', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <FormGroup className="mb-4">
        <FormLabel htmlFor="name">
          Name <RequiredIndicator />
        </FormLabel>
        <FormInput id="name" defaultValue="" placeholder="Client name" />
      </FormGroup>
    )

    const input = screen.getByLabelText(/Name/)
    expect(input).toHaveClass('bg-surface-elevated', 'text-text', 'border-border')
    await user.type(input, 'Ada')
    expect(input).toHaveValue('Ada')

    const label = screen.getByText('Name')
    expect(label).toHaveClass('text-sm', 'font-medium')
    expect(label.parentElement).toHaveClass('space-y-1', 'mb-4')
    expect(screen.getByText('*')).toHaveClass('text-danger')
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('merges custom classes on the input', () => {
    renderWithProviders(<FormInput aria-label="Qty" className="text-right" />)
    expect(screen.getByLabelText('Qty')).toHaveClass('text-right', 'rounded-md')
  })

  it('renders a textarea with the shared control styles', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FormTextarea aria-label="Notes" className="h-24" />)
    const textarea = screen.getByLabelText('Notes')
    expect(textarea).toHaveClass('bg-surface-elevated', 'h-24')
    await user.type(textarea, 'hello')
    expect(textarea).toHaveValue('hello')
  })

  it('renders a select with the shared control styles', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <FormSelect aria-label="Type" defaultValue="a">
        <option value="a">A</option>
        <option value="b">B</option>
      </FormSelect>
    )
    const select = screen.getByLabelText('Type')
    expect(select).toHaveClass('bg-surface-elevated')
    await user.selectOptions(select, 'b')
    expect(select).toHaveValue('b')
  })

  it('renders FormError in danger color with an alert role', () => {
    renderWithProviders(<FormError message="Required field" />)
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Required field')
    expect(error).toHaveClass('text-danger')
  })

  it('renders nothing when FormError has no message', () => {
    const { container } = renderWithProviders(<FormError />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when FormError message is empty', () => {
    const { container } = renderWithProviders(<FormError message="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
