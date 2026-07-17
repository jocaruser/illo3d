import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateClientDialog } from '@/Component/detail/CreateClientDialog'
import { Client } from '@/Entity/Client'
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

function existingClient(): Client {
  return Client.fromRecord({
    id: 'CL1',
    name: 'Acme Corp',
    email: 'hi@acme.test',
    phone: '600',
    notes: 'vip client',
    preferred_contact: 'email',
    lead_source: 'referred by @CL2',
    address: '1 Main St',
    created_at: '2024-01-02',
  })
}

beforeEach(() => {
  world = createWorld({ clients: [existingClient().toRecord()] })
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('CreateClientDialog', () => {
  it('renders nothing while closed', () => {
    renderWithProviders(<CreateClientDialog open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('creates a client from every optional field', async () => {
    const onSaved = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<CreateClientDialog open onClose={onClose} onSaved={onSaved} />)

    expect(screen.getByRole('heading', { name: 'Add client' })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Name/), 'Gamma Ltd')
    await user.type(screen.getByLabelText('Email'), 'hi@gamma.test')
    await user.type(screen.getByLabelText('Phone'), '900')
    await user.type(screen.getByLabelText('Preferred contact'), 'phone')
    await user.type(screen.getByLabelText('Lead source'), 'sent by @CL1')
    await user.type(screen.getByLabelText('Address'), '2 Side St')
    await user.type(screen.getByLabelText('Notes'), 'a note')
    await user.click(screen.getByRole('button', { name: 'Create client' }))

    const created = world.em.clients.find('CL2')
    expect(created).toMatchObject({
      name: 'Gamma Ltd',
      email: 'hi@gamma.test',
      phone: '900',
      preferredContact: 'phone',
      leadSource: 'sent by @CL1',
      address: '2 Side St',
      notes: 'a note',
      createdAt: '2024-05-20',
    })
    expect(onSaved).toHaveBeenCalledWith(created, 'create')
    expect(onClose).toHaveBeenCalled()
    expect(toastMock.success).toHaveBeenCalledWith('Saved successfully')
  })

  it('rejects a blank name and keeps the dialog open', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<CreateClientDialog open onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Create client' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Name is required')
    expect(onClose).not.toHaveBeenCalled()
    expect(world.em.clients.findAll()).toHaveLength(1)
  })

  it('rejects a whitespace-only name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CreateClientDialog open onClose={vi.fn()} />)

    await user.type(screen.getByLabelText(/Name/), '   ')
    await user.click(screen.getByRole('button', { name: 'Create client' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Name is required')
  })

  it('prefills every field in edit mode and updates the client', async () => {
    const onSaved = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <CreateClientDialog open onClose={vi.fn()} client={existingClient()} onSaved={onSaved} />
    )

    expect(screen.getByRole('heading', { name: 'Edit client' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Name/)).toHaveValue('Acme Corp')
    expect(screen.getByLabelText('Email')).toHaveValue('hi@acme.test')
    expect(screen.getByLabelText('Phone')).toHaveValue('600')
    expect(screen.getByLabelText('Preferred contact')).toHaveValue('email')
    expect(screen.getByLabelText('Lead source')).toHaveValue('referred by @CL2')
    expect(screen.getByLabelText('Address')).toHaveValue('1 Main St')
    expect(screen.getByLabelText('Notes')).toHaveValue('vip client')

    const name = screen.getByLabelText(/Name/)
    await user.clear(name)
    await user.type(name, 'Acme Renamed')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(world.em.clients.find('CL1')?.name).toBe('Acme Renamed')
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 'CL1' }), 'edit')
  })

  it('surfaces the service error when the edited client vanished', async () => {
    const user = userEvent.setup()
    const missing = existingClient()
    missing.id = 'CL404'
    renderWithProviders(<CreateClientDialog open onClose={vi.fn()} client={missing} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Client not found.')
  })

  it('re-seeds the form and clears the error when reopened', async () => {
    const user = userEvent.setup()
    const { rerender } = renderWithProviders(<CreateClientDialog open onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Create client' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.type(screen.getByLabelText(/Name/), 'draft name')

    rerender(<CreateClientDialog open={false} onClose={vi.fn()} />)
    rerender(<CreateClientDialog open onClose={vi.fn()} />)

    expect(screen.getByLabelText(/Name/)).toHaveValue('')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('closes without saving on Cancel', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<CreateClientDialog open onClose={onClose} />)

    await user.type(screen.getByLabelText(/Name/), 'Never saved')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalled()
    expect(world.em.clients.findAll()).toHaveLength(1)
  })

  it('tolerates a missing onSaved handler', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(<CreateClientDialog open onClose={onClose} />)

    await user.type(screen.getByLabelText(/Name/), 'Gamma Ltd')
    await user.click(screen.getByRole('button', { name: 'Create client' }))

    expect(onClose).toHaveBeenCalled()
  })
})
