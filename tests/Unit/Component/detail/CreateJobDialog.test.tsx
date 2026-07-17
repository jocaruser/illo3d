import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateJobDialog } from '@/Component/detail/CreateJobDialog'
import type { ShopMetadata } from '@/Entity/ShopMetadata'
import { Job } from '@/Entity/Job'
import type { EntityManager } from '@/Repository/EntityManager'
import { createWorld, renderWithProviders, type TestWorld } from './helpers/renderDetail'

const { toastMock, metadataMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
  metadataMock: {
    value: { metadata: null as ShopMetadata | null, loading: false, error: null as string | null },
  },
}))

let world: TestWorld

vi.mock('@/Hook/useEntityManager', () => ({
  useEntityManager: (): EntityManager => world.em,
}))
vi.mock('@/Hook/useShopMetadata', () => ({ useShopMetadata: () => metadataMock.value }))
vi.mock('@/Component/Toast', () => ({ toast: toastMock }))

function metadata(defaultDueDate?: number): ShopMetadata {
  return {
    app: 'illo3d',
    version: '3.0.0',
    spreadsheetId: 'sheet-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    createdBy: 'test@example.com',
    defaultDueDate,
  }
}

function existingJob(): Job {
  return Job.fromRecord({
    id: 'J1',
    client_id: 'CL2',
    description: 'Phone case',
    status: 'in_progress',
    created_at: '2024-05-01T09:00:00.000Z',
    due_date: '2024-06-01',
  })
}

beforeEach(() => {
  world = createWorld({
    clients: [
      { id: 'CL1', name: 'Acme Corp', created_at: '2024-01-01' },
      { id: 'CL2', name: 'Beta LLC', created_at: '2024-01-01' },
      { id: 'CL3', name: 'Archived Co', created_at: '2024-01-01', archived: 'true' },
    ],
    jobs: [existingJob().toRecord()],
  })
  metadataMock.value = { metadata: null, loading: false, error: null }
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('CreateJobDialog', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<CreateJobDialog open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('creates a job for a client picked from the searchable list', async () => {
    const onCreated = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={onClose} onCreated={onCreated} />)

    expect(screen.getByRole('heading', { name: 'Create job' })).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Search clients…'), 'Beta')
    await user.click(screen.getByRole('option', { name: 'Beta LLC' }))
    await user.type(screen.getByLabelText(/Description/), 'New bracket')
    await user.click(screen.getByRole('button', { name: 'Create job' }))

    expect(world.em.jobs.find('J2')).toMatchObject({
      clientId: 'CL2',
      description: 'New bracket',
      status: 'draft',
    })
    expect(onCreated).toHaveBeenCalledWith('J2')
    expect(onClose).toHaveBeenCalled()
    expect(toastMock.success).toHaveBeenCalledWith('Saved successfully')
  })

  it('offers only active clients', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} />)

    await user.click(screen.getByPlaceholderText('Search clients…'))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Acme Corp',
      'Beta LLC',
    ])
  })

  it('prefills the due date from the shop default', async () => {
    metadataMock.value = { metadata: metadata(7), loading: false, error: null }
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} />)

    // The clock is frozen at 2024-05-20, so seven days out is 2024-05-27.
    expect(screen.getByLabelText('Due date')).toHaveValue('2024-05-27')
  })

  it('leaves the due date empty when the shop sets no default', () => {
    metadataMock.value = { metadata: metadata(undefined), loading: false, error: null }
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} />)
    expect(screen.getByLabelText('Due date')).toHaveValue('')
  })

  it('leaves the due date empty when there is no metadata at all', () => {
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} />)
    expect(screen.getByLabelText('Due date')).toHaveValue('')
  })

  it('saves an explicit due date', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} presetClientId="CL1" />)

    await user.type(screen.getByLabelText(/Description/), 'Dated job')
    await user.type(screen.getByLabelText('Due date'), '2024-07-04')
    await user.click(screen.getByRole('button', { name: 'Create job' }))

    expect(world.em.jobs.find('J2')?.dueDate).toBe('2024-07-04')
  })

  it('hides the client picker and locks the client when preset', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} presetClientId="CL1" />)

    expect(screen.queryByPlaceholderText('Search clients…')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Description/), 'Preset job')
    await user.click(screen.getByRole('button', { name: 'Create job' }))

    expect(world.em.jobs.find('J2')?.clientId).toBe('CL1')
  })

  it('has no job-level price field', () => {
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} />)
    expect(screen.queryByLabelText(/Price/)).not.toBeInTheDocument()
  })

  it('rejects a missing client', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/Description/), 'No client')
    await user.click(screen.getByRole('button', { name: 'Create job' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Select a client')
    expect(world.em.jobs.findAll()).toHaveLength(1)
  })

  it('rejects a blank description', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} presetClientId="CL1" />)

    await user.click(screen.getByRole('button', { name: 'Create job' }))
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
  })

  it('prefills and updates in edit mode', async () => {
    const onUpdated = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <CreateJobDialog open onClose={vi.fn()} job={existingJob()} onUpdated={onUpdated} />
    )

    expect(screen.getByRole('heading', { name: 'Edit job' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search clients…')).toHaveValue('Beta LLC')
    expect(screen.getByLabelText(/Description/)).toHaveValue('Phone case')
    expect(screen.getByLabelText('Due date')).toHaveValue('2024-06-01')

    const description = screen.getByLabelText(/Description/)
    await user.clear(description)
    await user.type(description, 'Phone case v2')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(world.em.jobs.find('J1')?.description).toBe('Phone case v2')
    expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 'J1' }))
  })

  it('surfaces the service error when the edited job vanished', async () => {
    const user = userEvent.setup()
    const missing = existingJob()
    missing.id = 'J404'
    renderWithProviders(<CreateJobDialog open onClose={vi.fn()} job={missing} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Job not found.')
  })

  it('re-seeds on reopen', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(
      <CreateJobDialog open onClose={vi.fn()} presetClientId="CL1" />
    )

    await user.type(screen.getByLabelText(/Description/), 'draft text')
    rerender(<CreateJobDialog open={false} onClose={vi.fn()} presetClientId="CL1" />)
    rerender(<CreateJobDialog open onClose={vi.fn()} presetClientId="CL1" />)

    expect(screen.getByLabelText(/Description/)).toHaveValue('')
  })

  it('closes without saving on Cancel', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<CreateJobDialog open onClose={onClose} presetClientId="CL1" />)

    await user.type(screen.getByLabelText(/Description/), 'Never saved')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
    expect(world.em.jobs.findAll()).toHaveLength(1)
  })

  it('tolerates missing onCreated and onUpdated handlers', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(
      <CreateJobDialog open onClose={onClose} presetClientId="CL1" />
    )

    await user.type(screen.getByLabelText(/Description/), 'Orphan create')
    await user.click(screen.getByRole('button', { name: 'Create job' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    rerender(<CreateJobDialog open onClose={onClose} job={existingJob()} />)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
