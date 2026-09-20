import { screen, within } from '@testing-library/react'
import { ClientMetricsWidgetGrid } from '@/Component/detail/ClientMetricsWidgetGrid'
import type { ClientMetrics } from '@/Service/Pricing/clientMetrics'
import { renderWithProviders } from '../helpers/renderWithProviders'

function renderGrid(metrics: ClientMetrics) {
  return renderWithProviders(<ClientMetricsWidgetGrid metrics={metrics} />)
}

function metricValue(metricsRoot: HTMLElement, label: string): HTMLElement {
  const labelEl = within(metricsRoot).getByText(label)
  const valueContainer = labelEl.parentElement?.nextElementSibling
  if (valueContainer === null || valueContainer === undefined) {
    throw new Error(`No value container for metric label "${label}"`)
  }
  return valueContainer as HTMLElement
}

describe('ClientMetricsWidgetGrid', () => {
  const baseMetrics: ClientMetrics = {
    paidLedger: 42,
    outstandingJobs: 0,
    jobCount: 1,
    averageJobPrice: 42,
    materialsEstimate: 0.4,
  }

  it('renders the metrics region and all five labels', () => {
    renderGrid(baseMetrics)
    const region = screen.getByTestId('client-metrics')
    expect(region).toHaveClass('grid', 'grid-cols-2', 'lg:grid-cols-5')

    expect(within(region).getByText('Paid (ledger)')).toBeInTheDocument()
    expect(within(region).getByText('Outstanding (jobs)')).toBeInTheDocument()
    expect(within(region).getByText('Jobs')).toBeInTheDocument()
    expect(within(region).getByText('Avg job price')).toBeInTheDocument()
    expect(within(region).getByText('Materials (estimate)')).toBeInTheDocument()
  })

  it('formats money and count values', () => {
    renderGrid(baseMetrics)
    const region = screen.getByTestId('client-metrics')

    expect(metricValue(region, 'Paid (ledger)')).toHaveTextContent('€42.00')
    expect(metricValue(region, 'Outstanding (jobs)')).toHaveTextContent('€0.00')
    expect(metricValue(region, 'Jobs')).toHaveTextContent('1')
    expect(metricValue(region, 'Avg job price')).toHaveTextContent('€42.00')
    expect(metricValue(region, 'Materials (estimate)')).toHaveTextContent('€0.40')
  })

  it('colours money from numeric sign', () => {
    renderGrid({
      paidLedger: 10,
      outstandingJobs: -5,
      jobCount: 2,
      averageJobPrice: 0,
      materialsEstimate: -0.01,
    })
    const region = screen.getByTestId('client-metrics')

    expect(metricValue(region, 'Paid (ledger)').querySelector('span')).toHaveClass('text-success')
    expect(metricValue(region, 'Outstanding (jobs)').querySelector('span')).toHaveClass('text-danger')
    expect(metricValue(region, 'Avg job price').querySelector('span')).toHaveClass('text-success')
    expect(metricValue(region, 'Materials (estimate)').querySelector('span')).toHaveClass(
      'text-danger'
    )
  })

  it('shows a dash for average price when none is priced', () => {
    renderGrid({ ...baseMetrics, averageJobPrice: null })
    const region = screen.getByTestId('client-metrics')
    expect(metricValue(region, 'Avg job price')).toHaveTextContent('—')
    expect(metricValue(region, 'Avg job price').querySelector('.text-success')).toBeNull()
    expect(metricValue(region, 'Avg job price').querySelector('.text-danger')).toBeNull()
  })
})
