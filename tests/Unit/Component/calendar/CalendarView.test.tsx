import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarView } from '@/Component/calendar/CalendarView'
import { seedClient, seedJob, setupShop } from '../dashboard/harness'
import { renderWithProviders } from '../helpers/renderWithProviders'
import type { TestContext } from '../../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('../dashboard/harness')
  return { useEntityManager: () => harness.currentEm() }
})

let context: TestContext

const TODAY = new Date('2026-07-16T12:00:00.000Z')

function setViewportWidth(width: number): void {
  window.innerWidth = width
  act(() => {
    fireEvent(window, new Event('resize'))
  })
}

function day(iso: string): HTMLElement {
  const cell = screen.getAllByTestId('calendar-day').find((node) => node.dataset.day === iso)
  if (cell === undefined) throw new Error(`no cell for ${iso}`)
  return cell
}

describe('CalendarView', () => {
  beforeEach(() => {
    context = setupShop()
    seedClient(context.tabs, { id: 'CL1', name: 'Acme' })
    window.innerWidth = 1024
  })

  describe('month grid', () => {
    it('titles the current month and highlights today', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Vase',
        due_date: '2026-07-16',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument()
      expect(day('2026-07-16')).toHaveClass('ring-primary')
      expect(day('2026-07-15')).not.toHaveClass('ring-primary')
    })

    it('places a job on its due date with client and link', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Vase',
        due_date: '2026-07-20',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      const chip = within(day('2026-07-20')).getByRole('link')
      expect(chip).toHaveAttribute('href', '/jobs/J1')
      expect(chip).toHaveTextContent('Vase')
      expect(chip).toHaveTextContent('Acme')
    })

    it('falls back to the created date when no due date is set', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Vase',
        created_at: '2026-07-08T09:00:00.000Z',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(within(day('2026-07-08')).getByRole('link')).toHaveTextContent('Vase')
    })

    it('omits the client when the job points at nothing', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL404',
        description: 'Orphan',
        due_date: '2026-07-20',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(within(day('2026-07-20')).getByRole('link')).toHaveTextContent('Orphan')
      expect(screen.queryByText(/·/)).not.toBeInTheDocument()
    })

    it('stacks several jobs due on the same day', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Vase',
        due_date: '2026-07-20',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'Gear',
        due_date: '2026-07-20',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(within(day('2026-07-20')).getAllByRole('link')).toHaveLength(2)
    })

    it('colors an overdue chip by its band', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Late',
        due_date: '2026-07-01',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(within(day('2026-07-01')).getByRole('link')).toHaveClass('text-danger')
    })

    it('excludes archived and deleted jobs', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Archived',
        due_date: '2026-07-20',
        archived: 'true',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'Deleted',
        due_date: '2026-07-20',
        deleted: 'true',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(screen.getByText('No jobs due this month.')).toBeInTheDocument()
    })

    it('keeps neighbouring-month days empty', () => {
      // 2026-06-29 is a leading day of the July grid.
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'June job',
        due_date: '2026-06-29',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'July job',
        due_date: '2026-07-20',
      })

      renderWithProviders(<CalendarView today={TODAY} />)

      expect(within(day('2026-06-29')).queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('July job')).toBeInTheDocument()
    })
  })

  describe('month navigation', () => {
    beforeEach(() => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'August job',
        due_date: '2026-08-04',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'June job',
        due_date: '2026-06-04',
      })
    })

    it('steps forward a month', async () => {
      renderWithProviders(<CalendarView today={TODAY} />)

      await userEvent.click(screen.getByRole('button', { name: 'Next month' }))

      expect(screen.getByRole('heading', { name: 'August 2026' })).toBeInTheDocument()
      expect(within(day('2026-08-04')).getByRole('link')).toHaveTextContent('August job')
    })

    it('steps back a month', async () => {
      renderWithProviders(<CalendarView today={TODAY} />)

      await userEvent.click(screen.getByRole('button', { name: 'Previous month' }))

      expect(screen.getByRole('heading', { name: 'June 2026' })).toBeInTheDocument()
      expect(within(day('2026-06-04')).getByRole('link')).toHaveTextContent('June job')
    })
  })

  it('shows an empty state for a month with nothing due', () => {
    renderWithProviders(<CalendarView today={TODAY} />)

    expect(screen.getByText('No jobs due this month.')).toBeInTheDocument()
    expect(screen.queryByTestId('calendar-day')).not.toBeInTheDocument()
  })

  it('defaults to the entity manager clock when no today is given', () => {
    seedJob(context.tabs, {
      id: 'J1',
      client_id: 'CL1',
      description: 'Vase',
      due_date: '2026-07-20',
    })

    renderWithProviders(<CalendarView />)

    expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument()
  })

  describe('narrow viewport', () => {
    it('lists the days that have work instead of drawing a grid', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Later',
        due_date: '2026-07-20',
      })
      seedJob(context.tabs, {
        id: 'J2',
        client_id: 'CL1',
        description: 'Today job',
        due_date: '2026-07-16',
      })
      window.innerWidth = 500

      renderWithProviders(<CalendarView today={TODAY} />)

      const days = screen.getAllByTestId('calendar-day')
      expect(days.map((node) => node.dataset.day)).toEqual(['2026-07-16', '2026-07-20'])
      expect(within(days[0]).getByText('Today')).toBeInTheDocument()
      expect(within(days[1]).queryByText('Today')).not.toBeInTheDocument()
      expect(screen.queryByText('Mon')).not.toBeInTheDocument()
    })

    it('switches between the grid and the list as the viewport changes', () => {
      seedJob(context.tabs, {
        id: 'J1',
        client_id: 'CL1',
        description: 'Vase',
        due_date: '2026-07-20',
      })

      renderWithProviders(<CalendarView today={TODAY} />)
      expect(screen.getByText('Mon')).toBeInTheDocument()

      setViewportWidth(500)
      expect(screen.queryByText('Mon')).not.toBeInTheDocument()

      setViewportWidth(1024)
      expect(screen.getByText('Mon')).toBeInTheDocument()
    })
  })
})
