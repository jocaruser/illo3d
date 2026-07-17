import { screen, within } from '@testing-library/react'
import { DetailWidget, WidgetGrid } from '@/Component/detail/DetailWidget'
import { EntityDetailPage } from '@/Component/detail/EntityDetailPage'
import { renderWithProviders } from './helpers/renderDetail'

describe('EntityDetailPage', () => {
  it('renders the back link, title and fields', () => {
    renderWithProviders(
      <EntityDetailPage
        backTo="/clients"
        backLabel="Back to clients"
        title="Acme Corp"
        fields={[
          { label: 'ID', value: 'CL1' },
          { label: 'Email', value: <a href="mailto:hi@acme.test">hi@acme.test</a> },
        ]}
      />
    )

    expect(screen.getByTestId('entity-detail-back')).toHaveAttribute('href', '/clients')
    expect(screen.getByRole('heading', { name: 'Acme Corp' })).toBeInTheDocument()
    expect(screen.getByText('ID')).toBeInTheDocument()
    expect(screen.getByText('CL1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'hi@acme.test' })).toBeInTheDocument()
  })

  it('renders the actions slot and children', () => {
    renderWithProviders(
      <EntityDetailPage
        backTo="/jobs"
        backLabel="Back to jobs"
        title="J1"
        fields={[]}
        actions={<button type="button">Archive</button>}
      >
        <p>section body</p>
      </EntityDetailPage>
    )

    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByText('section body')).toBeInTheDocument()
  })

  it('omits the actions container when no actions are given', () => {
    renderWithProviders(
      <EntityDetailPage backTo="/jobs" backLabel="Back" title="J1" fields={[]} />
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('DetailWidget', () => {
  it('renders a label, value and test id', () => {
    renderWithProviders(
      <DetailWidget label="Total" testId="job-widget-total">
        €42.00
      </DetailWidget>
    )

    const widget = screen.getByTestId('job-widget-total')
    expect(within(widget).getByText('Total')).toBeInTheDocument()
    expect(within(widget).getByText('€42.00')).toBeInTheDocument()
  })

  it.each([
    [1, ''],
    [2, 'md:col-span-2'],
    [3, 'md:col-span-3'],
    [4, 'md:col-span-4'],
  ] as const)('applies the col span class for %s', (colSpan, expected) => {
    renderWithProviders(
      <DetailWidget label="Wide" colSpan={colSpan} testId="widget">
        body
      </DetailWidget>
    )

    const widget = screen.getByTestId('widget')
    if (expected === '') expect(widget.className).not.toMatch(/col-span/)
    else expect(widget).toHaveClass(expected)
  })

  it('renders header actions', () => {
    renderWithProviders(
      <DetailWidget label="ID" actions={<button type="button">Edit</button>}>
        J1
      </DetailWidget>
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('accepts extra classes', () => {
    renderWithProviders(
      <DetailWidget label="ID" testId="widget" className="custom">
        J1
      </DetailWidget>
    )
    expect(screen.getByTestId('widget')).toHaveClass('custom')
  })
})

describe('WidgetGrid', () => {
  it('lays widgets out responsively and accepts extra classes', () => {
    const { container } = renderWithProviders(
      <WidgetGrid className="extra">
        <span>child</span>
      </WidgetGrid>
    )

    const grid = container.querySelector('div') as HTMLElement
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3', 'extra')
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
