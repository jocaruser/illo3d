import { act, screen } from '@testing-library/react'
import { OperationToast } from '@/Component/layout/OperationToast'
import { useOperationStore } from '@/Store/operationStore'
import { renderLayout } from './renderLayout'

function startLoad(total = 11) {
  act(() => {
    useOperationStore
      .getState()
      .start('load', {
        total,
        blocking: false,
        message: 'workbook.loadingWorkbook',
      })
  })
}

describe('OperationToast', () => {
  beforeEach(() => {
    useOperationStore.getState().finish()
  })

  it('stays out of the way while nothing is running', () => {
    renderLayout(<OperationToast />)

    expect(screen.queryByTestId('operation-toast')).not.toBeInTheDocument()
  })

  it('ignores blocking operations, which the overlay owns', () => {
    act(() => {
      useOperationStore
        .getState()
        .start('save', {
          total: 11,
          blocking: true,
          message: 'workbook.savingWorkbook',
        })
    })

    renderLayout(<OperationToast />)

    expect(screen.queryByTestId('operation-toast')).not.toBeInTheDocument()
  })

  it('ignores non-blocking saves, which the save preview narrates', () => {
    act(() => {
      useOperationStore
        .getState()
        .start('save', {
          total: 11,
          blocking: false,
          message: 'workbook.savingWorkbook',
        })
    })

    renderLayout(<OperationToast />)

    expect(screen.queryByTestId('operation-toast')).not.toBeInTheDocument()
  })

  it('announces a load without blocking the app', () => {
    startLoad()
    renderLayout(<OperationToast />)

    const toast = screen.getByTestId('operation-toast')
    expect(toast).toHaveAttribute('aria-live', 'polite')
    expect(toast).not.toHaveAttribute('aria-modal')
    expect(screen.getByText('Loading workbook')).toBeInTheDocument()
  })

  it('reports progress on the bar and in text', () => {
    startLoad()
    renderLayout(<OperationToast />)

    act(() => {
      useOperationStore.getState().progress(4, 'jobs')
    })

    const bar = screen.getByRole('progressbar', { name: 'Progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '4')
    expect(screen.getByText('4 of 11')).toBeInTheDocument()
    expect(screen.getByText('jobs')).toBeInTheDocument()
  })

  it('hides the sheet row until a sheet is being read', () => {
    startLoad()
    renderLayout(<OperationToast />)

    expect(screen.getByText('0 of 11')).toBeInTheDocument()
  })

  it('survives a zero-sheet operation without dividing by zero', () => {
    startLoad(0)
    renderLayout(<OperationToast />)

    expect(screen.getByText('0 of 0')).toBeInTheDocument()
  })

  it('disappears when the operation finishes', () => {
    startLoad()
    renderLayout(<OperationToast />)

    act(() => {
      useOperationStore.getState().finish()
    })

    expect(screen.queryByTestId('operation-toast')).not.toBeInTheDocument()
  })
})
