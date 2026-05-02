import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  const items = [
    { id: '1', name: 'Draft' },
    { id: '2', name: 'In Progress' },
    { id: '3', name: 'Done' },
  ]

  const getKey = (item: (typeof items)[0]) => item.id
  const getLabel = (item: (typeof items)[0]) => item.name

  it('renders native select with options', () => {
    render(
      <Select
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
  })

  it('calls onChange when option selected', () => {
    const onChange = vi.fn()
    render(
      <Select
        items={items}
        value=""
        onChange={onChange}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('shows selected value', () => {
    render(
      <Select
        items={items}
        value="2"
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('2')
  })

  it('shows placeholder when provided', () => {
    render(
      <Select
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
        placeholder="Select a status"
      />
    )

    expect(screen.getByText('Select a status')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(
      <Select
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
        disabled
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('applies custom className', () => {
    render(
      <Select
        items={items}
        value=""
        onChange={() => {}}
        getKey={getKey}
        getLabel={getLabel}
        className="custom-class"
      />
    )

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('custom-class')
  })
})
