import { screen } from '@testing-library/react'
import {
  DataTable,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Component/table/DataTable'
import { renderWithProviders } from '../helpers/renderWithProviders'

describe('DataTable family', () => {
  it('renders a full table with zebra striping and muted uppercase headers', () => {
    renderWithProviders(
      <DataTable>
        <TableHead>
          <TableRow>
            <TableHeader>Name</TableHeader>
            <TableHeader className="text-right">Amount</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Row one</TableCell>
            <TableCell className="text-right" colSpan={1}>
              10
            </TableCell>
          </TableRow>
          <TableRow className="row-extra">
            <TableCell>Row two</TableCell>
            <TableCell>20</TableCell>
          </TableRow>
        </TableBody>
      </DataTable>
    )

    const table = screen.getByRole('table')
    expect(table).toHaveClass('w-full', 'text-sm')
    expect(table.parentElement).toHaveClass('overflow-x-auto', 'border-border')

    const header = screen.getByRole('columnheader', { name: 'Name' })
    expect(header).toHaveClass('uppercase', 'text-text-muted')
    expect(header).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveClass('text-right')

    const tbody = table.querySelector('tbody')
    expect(tbody).toHaveClass(
      '[&>tr:nth-child(odd)]:bg-surface-elevated',
      '[&>tr:nth-child(even)]:bg-surface-alt'
    )
    expect(screen.getByText('Row two').closest('tr')).toHaveClass('row-extra')
    expect(screen.getByText('10')).toHaveAttribute('colspan', '1')

    const thead = table.querySelector('thead')
    expect(thead).toHaveClass('bg-surface-alt')
  })

  it('renders TableEmptyRow as one centered spanned cell', () => {
    renderWithProviders(
      <DataTable>
        <TableBody>
          <TableEmptyRow colSpan={5} message="Nothing here" />
        </TableBody>
      </DataTable>
    )

    const cell = screen.getByText('Nothing here')
    expect(cell).toHaveAttribute('colspan', '5')
    expect(cell).toHaveClass('text-center', 'text-text-muted')
  })
})
