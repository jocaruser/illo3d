import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkbookActions } from '@/Component/layout/WorkbookActions'
import {
  useWorkbookService,
  type UseWorkbookService,
} from '@/Hook/useWorkbookService'
import { LocationProbe } from '../../helpers/LocationProbe'
import { renderLayout } from './renderLayout'

vi.mock('@/Hook/useWorkbookService', () => ({ useWorkbookService: vi.fn() }))

const api = {
  hydrate: vi.fn(),
  refresh: vi.fn(),
  confirmRefresh: vi.fn(),
  cancelRefresh: vi.fn(),
  save: vi.fn(),
}

function mockService(overrides: Partial<UseWorkbookService> = {}) {
  vi.mocked(useWorkbookService).mockReturnValue({
    ...api,
    needsConfirm: false,
    dirty: false,
    status: 'ready',
    ready: true,
    ...overrides,
  } as UseWorkbookService)
}

describe('WorkbookActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockService()
  })

  it('offers Review without a navbar refresh control', () => {
    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('button', { name: 'Review' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Refresh' })).not.toBeInTheDocument()
  })

  it('stays enabled when the workbook is clean', () => {
    mockService({ dirty: false })

    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('button', { name: 'Review' })).toBeEnabled()
  })

  it('disables Review while the workbook is not ready', () => {
    mockService({ dirty: true, ready: false })

    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled()
  })

  it('opens the save preview instead of writing anything', async () => {
    mockService({ dirty: true, ready: true })
    renderLayout(
      <>
        <LocationProbe />
        <WorkbookActions />
      </>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Review' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/save')
    expect(api.save).not.toHaveBeenCalled()
  })
})
