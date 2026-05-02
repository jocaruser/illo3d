import { render, screen } from '@testing-library/react'
import { BlockingOverlay } from './BlockingOverlay'
import { useOperationToastStore } from '@/stores/operationToastStore'

vi.mock('@/stores/operationToastStore')
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, params?: { sheet?: string }) => {
    if (params?.sheet) return `${key} ${params.sheet}…`
    return key
  }),
}))

describe('BlockingOverlay', () => {
  beforeEach(() => {
    vi.mocked(useOperationToastStore).mockReturnValue({
      blocking: false,
      phase: 'loading',
      operation: 'save',
      current: 0,
      total: 10,
      sheetName: '',
    })
  })

  it('renders nothing when blocking is false', () => {
    vi.mocked(useOperationToastStore).mockReturnValue({
      blocking: false,
      phase: 'loading',
      operation: 'save',
      current: 0,
      total: 10,
      sheetName: '',
    })
    render(<BlockingOverlay />)
    expect(screen.queryByText('workbook.savingWorkbook')).not.toBeInTheDocument()
  })

  it('renders nothing when phase is not loading', () => {
    vi.mocked(useOperationToastStore).mockReturnValue({
      blocking: true,
      phase: 'success',
      operation: 'save',
      current: 10,
      total: 10,
      sheetName: '',
    })
    render(<BlockingOverlay />)
    expect(screen.queryByText('workbook.savingWorkbook')).not.toBeInTheDocument()
  })

  it('renders overlay when blocking and loading', () => {
    vi.mocked(useOperationToastStore).mockReturnValue({
      blocking: true,
      phase: 'loading',
      operation: 'save',
      current: 3,
      total: 10,
      sheetName: 'clients',
    })
    render(<BlockingOverlay />)
    expect(screen.getByText('workbook.savingWorkbook')).toBeInTheDocument()
    expect(screen.getByText('workbook.savingSheet clients…')).toBeInTheDocument()
    expect(screen.getByText('3/10')).toBeInTheDocument()
  })

  it('shows progress bar with correct width', () => {
    vi.mocked(useOperationToastStore).mockReturnValue({
      blocking: true,
      phase: 'loading',
      operation: 'save',
      current: 5,
      total: 10,
      sheetName: 'jobs',
    })
    const { container } = render(<BlockingOverlay />)
    const progressBar = container.querySelector('.bg-blue-600')
    expect(progressBar).toHaveStyle({ width: '50%' })
  })

  it('renders nothing when operation is null', () => {
    vi.mocked(useOperationToastStore).mockReturnValue({
      blocking: true,
      phase: 'loading',
      operation: null,
      current: 0,
      total: 10,
      sheetName: '',
    })
    render(<BlockingOverlay />)
    expect(screen.queryByText('workbook.savingWorkbook')).not.toBeInTheDocument()
  })
})
