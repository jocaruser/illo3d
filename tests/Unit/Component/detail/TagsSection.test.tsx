import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagsSection } from '@/Component/detail/TagsSection'
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
    tags: [
      { id: 'TG1', name: 'Vip', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TG2', name: 'Rush', created_at: '2024-01-01T00:00:00.000Z' },
      { id: 'TG3', name: 'Retired', created_at: '2024-01-01T00:00:00.000Z', archived: 'true' },
    ],
    tag_links: [
      { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1', created_at: '2024-01-01T00:00:00.000Z' },
    ],
  })
}

beforeEach(() => {
  world = seedWorld()
  toastMock.success.mockClear()
  toastMock.error.mockClear()
})

describe('TagsSection', () => {
  it('lists the linked tags of a client', () => {
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    expect(screen.getByTestId('client-tags-section')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument()
    expect(screen.getByTestId('client-tag-chip-TG1')).toHaveTextContent('Vip')
  })

  it('shows the empty state when nothing is linked', () => {
    renderWithProviders(<TagsSection entityType="client" entityId="CL9" />)
    expect(screen.getByText('No tags yet.')).toBeInTheDocument()
  })

  it('offers only unlinked active tags as options', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    await user.click(screen.getByRole('combobox'))
    const options = screen.getAllByRole('option').map((option) => option.textContent)
    // Vip is already linked and Retired is archived.
    expect(options).toEqual(['Rush'])
  })

  it('links an existing tag picked from the list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'Rush' }))

    expect(screen.getByTestId('client-tag-chip-TG2')).toHaveTextContent('Rush')
    expect(world.em.tagLinks.hasActiveLink('TG2', 'client', 'CL1')).toBe(true)
    expect(toastMock.success).toHaveBeenCalledWith('Change applied — save to persist it')
  })

  it('creates a new tag in Title Case', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    await user.type(screen.getByRole('combobox'), 'urgent order')
    await user.click(screen.getByRole('option', { name: 'Create "urgent order"' }))

    expect(screen.getByText('Urgent Order')).toBeInTheDocument()
    expect(world.em.tags.find('TG4')?.name).toBe('Urgent Order')
  })

  it('reuses an existing tag name case-insensitively instead of duplicating', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TagsSection entityType="client" entityId="CL2" />)

    await user.type(screen.getByRole('combobox'), 'vIp')
    await user.click(screen.getByRole('option', { name: 'Create "vIp"' }))

    expect(world.em.tags.findAll()).toHaveLength(3)
    expect(world.em.tagLinks.hasActiveLink('TG1', 'client', 'CL2')).toBe(true)
  })

  it('toasts the service error when a malformed tag row has no name', async () => {
    const user = userEvent.setup()
    world.tabs.seed('tags', [{ id: 'TG4', name: '', created_at: '2024-01-01T00:00:00.000Z' }])
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    await user.click(screen.getByRole('combobox'))
    const blankOption = screen.getAllByRole('option').find((option) => option.textContent === '')
    await user.click(blankOption as HTMLElement)

    expect(toastMock.error).toHaveBeenCalledWith('This field is required')
    expect(world.em.tagLinks.hasActiveLink('TG4', 'client', 'CL1')).toBe(false)
  })

  it('unlinks a tag from its chip', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    await user.click(screen.getByRole('button', { name: 'Remove tag: Vip' }))

    expect(screen.getByText('No tags yet.')).toBeInTheDocument()
    expect(world.em.tagLinks.findAll()).toHaveLength(0)
    expect(toastMock.success).toHaveBeenCalledWith('Change applied — save to persist it')
  })

  it('ignores a picked option whose tag disappeared', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TagsSection entityType="client" entityId="CL1" />)

    await user.click(screen.getByRole('combobox'))
    world.em.tags.remove('TG2')
    await user.click(screen.getByRole('option', { name: 'Rush' }))

    expect(screen.queryByTestId('client-tag-chip-TG2')).not.toBeInTheDocument()
  })

  it('scopes itself to jobs with the job catalog keys', () => {
    world.em.tagLinks.save(
      Object.assign(world.em.tagLinks.find('TL1') as never, {
        id: 'TL2',
        entityType: 'job',
        entityId: 'J1',
      })
    )
    renderWithProviders(<TagsSection entityType="job" entityId="J1" />)

    expect(screen.getByTestId('job-tags-section')).toBeInTheDocument()
    expect(screen.getByTestId('job-tag-chip-TG1')).toHaveTextContent('Vip')
  })
})
