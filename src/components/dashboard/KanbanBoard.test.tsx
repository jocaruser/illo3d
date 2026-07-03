import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { KanbanBoard } from './KanbanBoard'
import type { Job, JobStatus } from '@/types/money'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('KanbanBoard', () => {
  function renderKanban(jobs: Job[], kanbanStaleDays?: number) {
    return render(
      <MemoryRouter>
        <KanbanBoard
          jobs={jobs}
          pieces={[]}
          pieceItems={[]}
          inventory={[]}
          lots={[]}
          clientsById={new Map()}
          onJobMoveToStatus={vi.fn()}
          statusUpdatingId={null}
          kanbanStaleDays={kanbanStaleDays}
        />
      </MemoryRouter>,
    )
  }

  function makeJob(overrides: Partial<Job> = {}): Job {
    return {
      id: overrides.id ?? 'J1',
      client_id: 'C1',
      description: 'test job',
      status: (overrides.status as JobStatus) ?? 'draft',
      created_at: overrides.created_at ?? daysAgo(0),
      archived: overrides.archived,
      deleted: overrides.deleted,
    }
  }

  it('renders all five status columns', () => {
    renderKanban([])
    expect(screen.getByText('dashboard.kanban.draft')).toBeInTheDocument()
    expect(screen.getByText('dashboard.kanban.inProgress')).toBeInTheDocument()
    expect(screen.getByText('dashboard.kanban.delivered')).toBeInTheDocument()
    expect(screen.getByText('dashboard.kanban.paid')).toBeInTheDocument()
    expect(screen.getByText('dashboard.kanban.cancelled')).toBeInTheDocument()
  })

  it('shows active paid job within threshold', () => {
    const job = makeJob({ id: 'P1', status: 'paid', created_at: daysAgo(3) })
    renderKanban([job])
    expect(screen.getByText('test job')).toBeInTheDocument()
  })

  it('hides stale paid job older than threshold', () => {
    const job = makeJob({ id: 'P2', status: 'paid', created_at: daysAgo(7) })
    renderKanban([job])
    expect(screen.queryByText('test job')).not.toBeInTheDocument()
  })

  it('hides stale cancelled job older than threshold', () => {
    const job = makeJob({ id: 'C2', status: 'cancelled', created_at: daysAgo(10) })
    renderKanban([job])
    expect(screen.queryByText('test job')).not.toBeInTheDocument()
  })

  it('shows delivered job regardless of age', () => {
    const job = makeJob({ id: 'D1', status: 'delivered', created_at: daysAgo(30) })
    renderKanban([job])
    expect(screen.getByText('test job')).toBeInTheDocument()
  })

  it('respects custom staleDays threshold from prop', () => {
    const job = makeJob({ id: 'P3', status: 'paid', created_at: daysAgo(4) })
    renderKanban([job], 3)
    expect(screen.queryByText('test job')).not.toBeInTheDocument()
  })

  it('does not cap cancelled column at 10', () => {
    const cancelledJobs = Array.from({ length: 15 }, (_, i) =>
      makeJob({ id: `C${i + 1}`, status: 'cancelled', created_at: daysAgo(i + 1) }),
    )
    renderKanban(cancelledJobs)
    const visibleJobs = cancelledJobs.filter((j) => {
      const jobDate = new Date(j.created_at)
      const days = Math.floor((Date.now() - jobDate.getTime()) / (1000 * 60 * 60 * 24))
      return j.status !== 'cancelled' || days <= 5
    })
    const jobTexts = screen.getAllByText('test job')
    expect(jobTexts).toHaveLength(visibleJobs.length)
  })

  it('excludes archived jobs regardless of status', () => {
    const job = makeJob({ id: 'A1', status: 'paid', created_at: daysAgo(1), archived: 'true' })
    renderKanban([job])
    expect(screen.queryByText('test job')).not.toBeInTheDocument()
  })
})
