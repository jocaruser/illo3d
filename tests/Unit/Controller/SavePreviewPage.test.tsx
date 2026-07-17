import type { ReactElement } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SavePreviewPage } from '@/Controller/SavePreviewPage'
import {
  useWorkbookService,
  type UseWorkbookService,
} from '@/Hook/useWorkbookService'
import { appendRecord, findRecordById, updateRecordById } from '@/Repository/Matrix'
import { useOperationStore } from '@/Store/operationStore'
import { emptyTabs, useWorkbookStore } from '@/Store/workbookStore'
import { LocationProbe } from '../helpers/LocationProbe'
import { i18n } from '../helpers/workbookTestBed'

vi.mock('@/Hook/useWorkbookService', () => ({ useWorkbookService: vi.fn() }))

const api = {
  hydrate: vi.fn(),
  refresh: vi.fn(),
  confirmRefresh: vi.fn(),
  cancelRefresh: vi.fn(),
  save: vi.fn(async () => true),
}

function mockService(overrides: Partial<UseWorkbookService> = {}) {
  vi.mocked(useWorkbookService).mockReturnValue({
    ...api,
    needsConfirm: false,
    dirty: useWorkbookStore.getState().dirty,
    status: 'ready',
    ready: true,
    ...overrides,
  } as UseWorkbookService)
}

/** The page under both providers, with a back-stack so navigate(-1) lands somewhere. */
function renderPage(entries: string[] = ['/clients', '/save']): ReturnType<typeof render> {
  const element: ReactElement = (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
        <LocationProbe />
        <Routes>
          <Route path="/save" element={<SavePreviewPage />} />
          <Route path="*" element={<span data-testid="other-route" />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>
  )
  return render(element)
}

/** A hydrated shop with one client, then an audited rename left unsaved. */
function seedDirtyWorkbook() {
  const tabs = emptyTabs()
  tabs.clients = appendRecord('clients', tabs.clients, {
    id: 'CL1',
    name: 'Acme',
    email: 'a@x.com',
  })
  useWorkbookStore.getState().hydrateTabs(tabs, 'wb-1')

  useWorkbookStore.getState().mutateTab('clients', (matrix) =>
    updateRecordById('clients', matrix, {
      id: 'CL1',
      name: 'Acme Ltd',
      email: 'a@x.com',
    })
  )
  useWorkbookStore.getState().mutateTab('audit_log', (matrix) =>
    appendRecord('audit_log', matrix, {
      id: 'AL1',
      timestamp: '2026-07-18T09:00:00.000Z',
      actor: 'local',
      entity_name: 'client',
      entity_id: 'CL1',
      action: 'update',
      before_json: JSON.stringify({ id: 'CL1', name: 'Acme', email: 'a@x.com' }),
      after_json: JSON.stringify({ id: 'CL1', name: 'Acme Ltd', email: 'a@x.com' }),
      fieldsChanged: 'name',
      parent_entity_name: '',
      parent_entity_id: '',
    })
  )
}

describe('SavePreviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useWorkbookStore.getState().reset()
    useOperationStore.getState().finish()
    api.save.mockResolvedValue(true)
  })

  it('lists every sheet and opens the first changed one on its diff', () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    expect(screen.getByTestId('save-preview-count')).toHaveTextContent('2 unsaved sheets')
    expect(screen.getByTestId('save-nav-clients')).toHaveTextContent('1 row changed')
    expect(screen.getByTestId('save-nav-audit_log')).toHaveTextContent('1 new entry')

    const card = screen.getByTestId('row-diff-clients-CL1')
    expect(within(card).getByText('name')).toBeInTheDocument()
    expect(within(card).getByText('Acme')).toBeInTheDocument()
    expect(within(card).getByText('Acme Ltd', { selector: 'span' })).toBeInTheDocument()
  })

  it('hides unchanged fields until asked', async () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    expect(screen.queryByText('email')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('save-preview-toggle-unchanged'))

    expect(screen.getByText('email')).toBeInTheDocument()
  })

  it('shows the pending audit entries when the audit log card is selected', async () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    await userEvent.click(screen.getByTestId('save-nav-audit_log'))

    const table = screen.getByRole('table')
    expect(within(table).getByText('AL1')).toBeInTheDocument()
  })

  it('shows a clean sheet as having no changes', async () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    await userEvent.click(screen.getByTestId('save-nav-tags'))

    expect(screen.getByText('No changes')).toBeInTheDocument()
  })

  it('reverting the only changed field drops the row from the diff', async () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    await userEvent.click(screen.getByTestId('revert-clients-CL1-name'))

    expect(
      findRecordById('clients', useWorkbookStore.getState().tabs.clients, 'CL1')?.name
    ).toBe('Acme')
    expect(screen.queryByTestId('row-diff-clients-CL1')).not.toBeInTheDocument()
    // The revert itself is audit-logged: the pending entries grew.
    expect(screen.getByTestId('save-nav-audit_log')).toHaveTextContent('2 new entries')
  })

  it('saves without the blocking overlay and returns whence it came', async () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    await userEvent.click(screen.getByTestId('save-preview-save-all'))

    expect(api.save).toHaveBeenCalledWith({ blocking: false })
    expect(screen.getByTestId('location')).toHaveTextContent('/clients')
  })

  it('stays on the preview when the save fails', async () => {
    seedDirtyWorkbook()
    mockService()
    api.save.mockResolvedValue(false)
    renderPage()

    await userEvent.click(screen.getByTestId('save-preview-save-all'))

    expect(screen.getByTestId('location')).toHaveTextContent('/save')
  })

  it('discard all runs through the refresh confirmation', async () => {
    seedDirtyWorkbook()
    mockService()
    renderPage()

    await userEvent.click(screen.getByTestId('save-preview-discard-all'))

    expect(api.refresh).toHaveBeenCalledTimes(1)
  })

  it('confirms before discarding', async () => {
    seedDirtyWorkbook()
    mockService({ needsConfirm: true })
    renderPage()

    expect(screen.getByRole('dialog')).toHaveTextContent('Discard unsaved changes?')

    await userEvent.click(screen.getByRole('button', { name: 'Discard and refresh' }))

    expect(api.confirmRefresh).toHaveBeenCalledTimes(1)
  })

  it('cancelling the discard keeps everything', async () => {
    seedDirtyWorkbook()
    mockService({ needsConfirm: true })
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(api.cancelRefresh).toHaveBeenCalledTimes(1)
  })

  it('shows the all-clean state when there is nothing to save', async () => {
    useWorkbookStore.getState().hydrateTabs(emptyTabs(), 'wb-1')
    mockService()
    renderPage()

    expect(
      screen.getByText('Nothing to save — everything is already stored.')
    ).toBeInTheDocument()
    expect(screen.getByTestId('save-preview-save-all')).toBeDisabled()
    expect(screen.getByTestId('save-preview-discard-all')).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByTestId('location')).toHaveTextContent('/clients')
  })

  it('shows the writer progress on the cards while a save runs', () => {
    seedDirtyWorkbook()
    useWorkbookStore.getState().beginSave()
    useOperationStore
      .getState()
      .start('save', { total: 11, blocking: false, message: 'workbook.savingWorkbook' })
    useOperationStore.getState().progress(1, 'clients')
    useOperationStore.getState().fail('jobs')
    mockService({ ready: false })
    renderPage()

    expect(screen.getByTestId('save-nav-clients')).toHaveAccessibleName('Clients: Saved')
    expect(screen.getByTestId('save-nav-jobs')).toHaveAccessibleName('Jobs: Failed')
    expect(screen.getByTestId('save-nav-tags')).toHaveAccessibleName('Tags: Saving')
    expect(screen.getByTestId('save-preview-save-all')).toBeDisabled()
  })
})
