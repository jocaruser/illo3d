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

  it('offers Refresh and Save', () => {
    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('disables Save while there is nothing to save', () => {
    mockService({ dirty: false })

    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('disables Save while the workbook is not ready', () => {
    mockService({ dirty: true, ready: false })

    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('opens the save preview instead of writing anything', async () => {
    mockService({ dirty: true, ready: true })
    renderLayout(
      <>
        <LocationProbe />
        <WorkbookActions />
      </>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/save')
    expect(api.save).not.toHaveBeenCalled()
  })

  it('refreshes on demand', async () => {
    renderLayout(<WorkbookActions />)

    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }))

    expect(api.refresh).toHaveBeenCalledTimes(1)
  })

  it('hides the discard prompt until the hook asks for it', () => {
    renderLayout(<WorkbookActions />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks before discarding local edits', async () => {
    mockService({ needsConfirm: true, dirty: true })
    renderLayout(<WorkbookActions />)

    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Discard unsaved changes?'
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Discard and refresh' })
    )

    expect(api.confirmRefresh).toHaveBeenCalledTimes(1)
  })

  it('keeps local edits on cancel', async () => {
    mockService({ needsConfirm: true, dirty: true })
    renderLayout(<WorkbookActions />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(api.cancelRefresh).toHaveBeenCalledTimes(1)
    expect(api.confirmRefresh).not.toHaveBeenCalled()
  })
})
