import { render, screen, fireEvent } from '@testing-library/react'
import { Combobox } from './Combobox'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('Combobox', () => {
  const items = [
    { id: '1', name: 'Filament Red' },
    { id: '2', name: 'Filament Blue' },
    { id: '3', name: 'Screwdriver' },
  ]

  const getKey = (item: (typeof items)[0]) => item.id
  const getLabel = (item: (typeof items)[0]) => item.name

  it('renders text input with combobox role', () => {
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('opens listbox on focus', () => {
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('filters items based on search query', () => {
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'fil' } })

    expect(screen.getByText('Filament Red')).toBeInTheDocument()
    expect(screen.getByText('Filament Blue')).toBeInTheDocument()
    expect(screen.queryByText('Screwdriver')).not.toBeInTheDocument()
  })

  it('navigates with arrow keys', () => {
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    expect(screen.getByText('Filament Red')).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    const secondOption = screen.getByText('Filament Blue')
    expect(secondOption).toHaveAttribute('aria-selected', 'true')
  })

  it('selects item on Enter', () => {
    const onChange = vi.fn()
    render(
      <Combobox
        items={items}
        value=""
        onChange={onChange}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('1')
  })

  it('closes on Escape', () => {
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('shows selected item label in input', () => {
    render(
      <Combobox
        items={items}
        value="2"
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('Filament Blue')
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
        disabled
      />
    )

    const input = screen.getByRole('combobox')
    expect(input).toBeDisabled()
  })

  it('shows "No items available" when items is empty', () => {
    render(
      <Combobox
        items={[]}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getByText('combobox.noItems')).toBeInTheDocument()
  })

  it('shows creatable option when no match', () => {
    const onCreateItem = vi.fn(() => Promise.resolve())
    render(
      <Combobox
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
        creatable
        onCreateItem={onCreateItem}
      />
    )

    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'New Item' } })

    expect(screen.getByText('combobox.createOption')).toBeInTheDocument()
  })
})
