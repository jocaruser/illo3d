import { act, screen } from '@testing-library/react'
import { BlockingOverlay } from '@/Component/layout/BlockingOverlay'
import { useOperationStore } from '@/Store/operationStore'
import { renderLayout } from './renderLayout'

function startSave(total = 11) {
  act(() => {
    useOperationStore
      .getState()
      .start('save', {
        total,
        blocking: true,
        message: 'workbook.savingWorkbook',
      })
  })
}

describe('BlockingOverlay', () => {
  beforeEach(() => {
    useOperationStore.getState().finish()
  })

  it('stays out of the way while nothing is running', () => {
    renderLayout(<BlockingOverlay />)

    expect(screen.queryByTestId('blocking-overlay')).not.toBeInTheDocument()
  })

  it('ignores non-blocking operations, which the toast owns', () => {
    act(() => {
      useOperationStore
        .getState()
        .start('load', {
          total: 11,
          blocking: false,
          message: 'workbook.loadingWorkbook',
        })
    })

    renderLayout(<BlockingOverlay />)

    expect(screen.queryByTestId('blocking-overlay')).not.toBeInTheDocument()
  })

  it('blocks the app with a localized, undismissable progress card', () => {
    startSave()
    renderLayout(<BlockingOverlay />)

    const overlay = screen.getByTestId('blocking-overlay')
    expect(overlay).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Saving workbook')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('reports progress on the bar and in text', () => {
    startSave()
    renderLayout(<BlockingOverlay />)

    act(() => {
      useOperationStore.getState().progress(3, 'clients')
    })

    const bar = screen.getByRole('progressbar', { name: 'Progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '11')
    expect(screen.getByText('3 of 11')).toBeInTheDocument()
    expect(screen.getByText('clients')).toBeInTheDocument()
  })

  it('hides the sheet row until a sheet is being written', () => {
    startSave()
    renderLayout(<BlockingOverlay />)

    expect(screen.getByText('0 of 11')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
  })

  it('survives a zero-sheet operation without dividing by zero', () => {
    startSave(0)
    renderLayout(<BlockingOverlay />)

    expect(screen.getByText('0 of 0')).toBeInTheDocument()
  })
})
