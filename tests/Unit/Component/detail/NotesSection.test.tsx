import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotesSection } from '@/Component/detail/NotesSection'
import type { EntityManager } from '@/Repository/EntityManager'
import { createWorld, renderWithProviders, type TestWorld } from './helpers/renderDetail'

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}))

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))
vi.mock('@/Component/Toast', () => ({ toast: toastMock }))

function seedWorld(): TestWorld {
  return createWorld({
    crm_notes: [
      {
        id: 'CN1',
        entity_type: 'client',
        entity_id: 'CL1',
        body: 'plain info note',
        severity: 'info',
        created_at: '2024-05-01T10:00:00.000Z',
      },
      {
        id: 'CN2',
        entity_type: 'client',
        entity_id: 'CL1',
        body: 'chase @J1 and @P2 and @CL9',
        severity: 'danger',
        created_at: '2024-05-02T10:00:00.000Z',
      },
      {
        id: 'CN3',
        entity_type: 'client',
        entity_id: 'CL2',
        body: 'other client',
        severity: 'info',
        created_at: '2024-05-03T10:00:00.000Z',
      },
      {
        id: 'CN4',
        entity_type: 'client',
        entity_id: 'CL1',
        body: 'deleted note',
        severity: 'info',
        created_at: '2024-05-04T10:00:00.000Z',
        deleted: 'true',
      },
      {
        id: 'JN1',
        entity_type: 'job',
        entity_id: 'J1',
        body: 'job scoped note',
        severity: 'warning',
        created_at: '2024-05-05T10:00:00.000Z',
      },
    ],
    pieces: [{ id: 'P2', job_id: 'J7', name: 'Shell', status: 'pending', created_at: '2024-01-01T00:00:00.000Z' }],
  })
}

beforeEach(() => {
  world = seedWorld()
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('NotesSection', () => {
  it('shows history without edit affordances when read-only', () => {
    renderWithProviders(
      <NotesSection entityType="client" entityId="CL1" readOnly />
    )

    // The notes and the severity strip stay visible…
    expect(screen.getByTestId('client-note-row-CN1')).toBeInTheDocument()
    expect(screen.getByTestId('client-notes-severity-strip')).toBeInTheDocument()
    // …but nothing can be added, edited or deleted.
    expect(screen.queryByTestId('client-note-add')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  })

  it('lists only the active notes of its own entity', () => {
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    expect(screen.getByTestId('client-note-row-CN1')).toBeInTheDocument()
    expect(screen.getByTestId('client-note-row-CN2')).toBeInTheDocument()
    expect(screen.queryByTestId('client-note-row-CN3')).not.toBeInTheDocument()
    expect(screen.queryByTestId('client-note-row-CN4')).not.toBeInTheDocument()
  })

  it('surfaces prominent severities in an alert strip', () => {
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const strip = screen.getByTestId('client-notes-severity-strip')
    expect(within(strip).getByText(/chase/)).toBeInTheDocument()
    // The info note is not prominent, so it stays out of the strip.
    expect(within(strip).queryByText('plain info note')).not.toBeInTheDocument()
  })

  it('renders no strip when every note is quiet', () => {
    renderWithProviders(<NotesSection entityType="client" entityId="CL2" />)
    expect(screen.queryByTestId('client-notes-severity-strip')).not.toBeInTheDocument()
  })

  it('linkifies client, job and piece mentions', () => {
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN2')
    expect(within(row).getByRole('link', { name: '@J1' })).toHaveAttribute('href', '/jobs/J1')
    expect(within(row).getByRole('link', { name: '@P2' })).toHaveAttribute(
      'href',
      '/jobs/J7#piece-P2'
    )
    expect(within(row).getByRole('link', { name: '@CL9' })).toHaveAttribute('href', '/clients/CL9')
  })

  it('leaves an unresolvable piece mention as plain text', () => {
    world.em.pieces.remove('P2')
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN2')
    expect(within(row).queryByRole('link', { name: '@P2' })).not.toBeInTheDocument()
    expect(row).toHaveTextContent('@P2')
  })

  it('adds a note with the chosen severity', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    await user.type(screen.getByPlaceholderText('Plain text note'), 'brand new note')
    await user.selectOptions(screen.getByLabelText('Severity'), 'warning')
    await user.click(screen.getByTestId('client-note-add'))

    expect(screen.getByTestId('client-note-row-CN5')).toHaveTextContent('brand new note')
    expect(world.em.crmNotes.find('CN5')?.severity).toBe('warning')
    expect(toastMock.success).toHaveBeenCalledWith('Note saved')
    // The composer resets for the next note.
    expect(screen.getByPlaceholderText('Plain text note')).toHaveValue('')
    expect(screen.getByLabelText('Severity')).toHaveValue('info')
  })

  it('records mentions of a new note as referenced ids', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    await user.type(screen.getByPlaceholderText('Plain text note'), 'see @J1 and @CL2')
    await user.click(screen.getByTestId('client-note-add'))

    expect(world.em.crmNotes.find('CN5')?.referencedEntityIds).toBe('J1 CL2')
  })

  it('rejects a blank note body', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    await user.type(screen.getByPlaceholderText('Plain text note'), '   ')
    await user.click(screen.getByTestId('client-note-add'))

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(world.em.crmNotes.find('CN5')).toBeNull()
  })

  it('edits a note body and severity inline', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN1')
    await user.click(within(row).getByRole('button', { name: 'Edit' }))

    const body = screen.getByLabelText('Plain text note CN1')
    await user.clear(body)
    await user.type(body, 'edited body')
    await user.selectOptions(screen.getByLabelText('Severity CN1'), 'success')
    await user.click(screen.getByRole('button', { name: 'Save note' }))

    expect(world.em.crmNotes.find('CN1')).toMatchObject({
      body: 'edited body',
      severity: 'success',
    })
    expect(screen.getByTestId('client-note-row-CN1')).toHaveTextContent('edited body')
  })

  it('rejects a blank body while editing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN1')
    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    await user.clear(screen.getByLabelText('Plain text note CN1'))
    await user.click(screen.getByRole('button', { name: 'Save note' }))

    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(world.em.crmNotes.find('CN1')?.body).toBe('plain info note')
  })

  it('abandons an edit on cancel', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN1')
    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    await user.type(screen.getByLabelText('Plain text note CN1'), ' changed')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByLabelText('Plain text note CN1')).not.toBeInTheDocument()
    expect(world.em.crmNotes.find('CN1')?.body).toBe('plain info note')
  })

  it('soft-deletes a note after confirming', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN1')
    await user.click(within(row).getByRole('button', { name: 'Delete' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: 'Delete note' })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    expect(screen.queryByTestId('client-note-row-CN1')).not.toBeInTheDocument()
    expect(world.em.crmNotes.find('CN1')?.isDeleted()).toBe(true)
  })

  it('keeps the note when the delete is cancelled', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="client" entityId="CL1" />)

    const row = screen.getByTestId('client-note-row-CN1')
    await user.click(within(row).getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(world.em.crmNotes.find('CN1')?.isDeleted()).toBe(false)
  })

  it('scopes itself to a job with the job catalog keys and JN ids', async () => {
    const user = userEvent.setup()
    renderWithProviders(<NotesSection entityType="job" entityId="J1" />)

    expect(screen.getByTestId('job-notes-severity-strip')).toBeInTheDocument()
    expect(screen.getByTestId('job-note-row-JN1')).toHaveTextContent('job scoped note')

    await user.type(screen.getByPlaceholderText('Plain text note'), 'second job note')
    await user.click(screen.getByTestId('job-note-add'))

    expect(screen.getByTestId('job-note-row-JN2')).toBeInTheDocument()
  })

  it('omits the timestamp for a note without a created date', () => {
    world.tabs.seed('crm_notes', [
      { id: 'CN9', entity_type: 'client', entity_id: 'CL5', body: 'undated', severity: 'info', created_at: '' },
    ])
    renderWithProviders(<NotesSection entityType="client" entityId="CL5" />)

    expect(screen.getByTestId('client-note-row-CN9')).toHaveTextContent('undated')
    expect(screen.queryByRole('time')).not.toBeInTheDocument()
  })
})
