import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox, type ComboboxItem } from '@/Component/Combobox'
import { renderWithProviders } from './helpers/renderWithProviders'

const items: ComboboxItem[] = [
  { key: 'CL1', label: 'Acme' },
  { key: 'CL2', label: 'Beta Corp' },
  { key: 'CL3', label: 'acme two' },
]

describe('Combobox', () => {
  it('shows the translated default placeholder and a custom one', () => {
    const { unmount } = renderWithProviders(
      <Combobox items={items} value={null} onChange={vi.fn()} />
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Search...')
    unmount()

    renderWithProviders(
      <Combobox items={items} value={null} onChange={vi.fn()} placeholder="Find a client" />
    )
    expect(screen.getByRole('combobox')).toHaveAttribute('placeholder', 'Find a client')
  })

  it('shows the selected label when idle and opens all items on focus', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value="CL2" onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    expect(input).toHaveValue('Beta Corp')
    expect(input).toHaveAttribute('aria-expanded', 'false')

    await user.click(input)
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.getByRole('option', { name: 'Beta Corp' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('option', { name: 'Acme' })).toHaveAttribute('aria-selected', 'false')
  })

  it('filters case-insensitively on substrings while showing the query', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value="CL2" onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.clear(input)
    await user.type(input, 'ACME')

    expect(input).toHaveValue('ACME')
    const options = screen.getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Acme', 'acme two'])
  })

  it('shows all items again when the query is cleared', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    await user.type(input, 'beta')
    expect(screen.getAllByRole('option')).toHaveLength(1)

    await user.clear(input)
    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('shows the no-items empty state', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={[]} value={null} onChange={vi.fn()} />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByText('No items available')).toBeInTheDocument()
  })

  it('shows the no-match empty state', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={vi.fn()} />)

    await user.type(screen.getByRole('combobox'), 'zzz')
    expect(screen.getByText('No matching items')).toBeInTheDocument()
  })

  it('navigates with wrapping arrows and selects with Enter', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    await user.click(input)

    const optionIds = screen.getAllByRole('option').map((option) => option.id)
    expect(input).toHaveAttribute('aria-activedescendant', optionIds[0])
    expect(screen.getByRole('option', { name: 'Acme' })).toHaveClass('bg-primary/10')

    await user.keyboard('{ArrowUp}')
    expect(input).toHaveAttribute('aria-activedescendant', optionIds[2])

    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', optionIds[0])

    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', optionIds[1])
    expect(screen.getByRole('option', { name: 'Beta Corp' })).toHaveClass('bg-primary/10')

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('CL2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens the closed list with ArrowDown without moving the highlight', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getAllByRole('option')[0].id
    )
    await user.keyboard('{Escape}')
  })

  it('ignores arrows and Enter when nothing matches', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    await user.type(input, 'zzz')
    await user.keyboard('{ArrowDown}{Enter}')

    expect(onChange).not.toHaveBeenCalled()
    expect(input).not.toHaveAttribute('aria-activedescendant')
  })

  it('does nothing on Enter while closed', () => {
    const onChange = vi.fn()
    renderWithProviders(<Combobox items={items} value={null} onChange={onChange} />)

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('closes on Escape and restores the selected label', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value="CL1" onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.clear(input)
    await user.type(input, 'beta')
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('Acme')
  })

  it('closes on blur and restores the selected label', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value="CL1" onChange={vi.fn()} />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.clear(input)
    await user.type(input, 'beta')
    await user.tab()

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(input).toHaveValue('Acme')
  })

  it('selects an option with the mouse and highlights on hover', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={onChange} />)

    const input = screen.getByRole('combobox')
    await user.click(input)

    const option = screen.getByRole('option', { name: 'acme two' })
    await user.hover(option)
    expect(option).toHaveClass('bg-primary/10')

    await user.click(option)
    expect(onChange).toHaveBeenCalledWith('CL3')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('offers a create option when creatable and calls onCreateItem', async () => {
    const onCreateItem = vi.fn()
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <Combobox items={items} value={null} onChange={onChange} creatable onCreateItem={onCreateItem} />
    )

    await user.type(screen.getByRole('combobox'), 'New Thing')
    const createOption = screen.getByRole('option', { name: 'Create "New Thing"' })

    await user.click(createOption)
    expect(onCreateItem).toHaveBeenCalledWith('New Thing')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps existing matches above the create option', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <Combobox items={items} value={null} onChange={vi.fn()} creatable onCreateItem={vi.fn()} />
    )

    await user.type(screen.getByRole('combobox'), 'acme')
    const options = screen.getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'Acme',
      'acme two',
      'Create "acme"',
    ])
  })

  it('tolerates a missing onCreateItem handler', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Combobox items={items} value={null} onChange={vi.fn()} creatable />)

    await user.type(screen.getByRole('combobox'), 'zzz')
    await user.click(screen.getByRole('option', { name: 'Create "zzz"' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('is inert when disabled', () => {
    renderWithProviders(<Combobox items={items} value={null} onChange={vi.fn()} disabled />)
    expect(screen.getByRole('combobox')).toBeDisabled()
  })
})
