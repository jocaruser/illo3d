import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Job, JobStatus } from '@/Entity/Job'
import { JobStatusFlowDialogs, useJobStatusFlow } from '@/Hook/useJobStatusFlow'
import { renderWithProviders } from '../Component/helpers/renderWithProviders'
import {
  currentEm,
  seedJob,
  seedPiece,
  seedPricedPiece,
  setupShop,
} from '../Component/dashboard/harness'
import type { TestContext } from '../Service/helpers'

vi.mock('@/Hook/useEntityManager', async () => {
  const harness = await import('../Component/dashboard/harness')
  return { useEntityManager: () => harness.currentEm() }
})

interface FlowHarnessProps {
  job: Job
  next: JobStatus
}

/** Drives the hook the way a page would: request, then answer the dialog. */
function FlowHarness({ job, next }: FlowHarnessProps) {
  const flow = useJobStatusFlow()
  return (
    <div>
      <button type="button" onClick={() => flow.requestStatusChange(job, next)}>
        request
      </button>
      <button type="button" onClick={flow.confirm}>
        confirm-directly
      </button>
      <span data-testid="error">{flow.error ?? ''}</span>
      <span data-testid="busy">{String(flow.busy)}</span>
      <JobStatusFlowDialogs flow={flow} />
    </div>
  )
}

let context: TestContext

function jobById(id: string): Job {
  const job = currentEm().jobs.find(id)
  if (job === null) throw new Error(`no job ${id}`)
  return job
}

function statusOf(id: string): string {
  return jobById(id).status
}

async function request(job: Job, next: JobStatus): Promise<void> {
  renderWithProviders(<FlowHarness job={job} next={next} />)
  await userEvent.click(screen.getByRole('button', { name: 'request' }))
}

describe('useJobStatusFlow', () => {
  beforeEach(() => {
    context = setupShop()
    seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase' })
  })

  describe('transitions needing no dialog', () => {
    it('commits draft to in_progress straight away', async () => {
      await request(jobById('J1'), 'in_progress')

      expect(statusOf('J1')).toBe('in_progress')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByTestId('error')).toHaveTextContent('')
      expect(screen.getByTestId('busy')).toHaveTextContent('false')
    })

    it('ignores a request to the status the job already has', async () => {
      await request(jobById('J1'), 'draft')

      expect(statusOf('J1')).toBe('draft')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('reports a job that is no longer in the workbook', async () => {
      const ghost = jobById('J1')
      ghost.id = 'J404'

      await request(ghost, 'delivered')

      expect(screen.getByTestId('error')).toHaveTextContent('jobs.jobNotFound')
    })
  })

  describe('pricing gate', () => {
    it.each(['paid', 'cancelled'] as const)(
      'refuses %s while a counting piece is unpriced',
      async (next) => {
        seedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })

        await request(jobById('J1'), next)

        expect(screen.getByTestId('error')).toHaveTextContent('jobs.paidPiecesIncomplete')
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(statusOf('J1')).toBe('draft')
      }
    )

    it('refuses paid when the job has no pieces at all', async () => {
      await request(jobById('J1'), 'paid')

      expect(screen.getByTestId('error')).toHaveTextContent('jobs.paidPiecesIncomplete')
      expect(statusOf('J1')).toBe('draft')
    })

    it('clears a previous error on the next request', async () => {
      seedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })
      const job = jobById('J1')
      renderWithProviders(<FlowHarness job={job} next="paid" />)

      await userEvent.click(screen.getByRole('button', { name: 'request' }))
      expect(screen.getByTestId('error')).toHaveTextContent('jobs.paidPiecesIncomplete')

      await userEvent.click(screen.getByRole('button', { name: 'request' }))
      expect(screen.getByTestId('error')).toHaveTextContent('jobs.paidPiecesIncomplete')
    })
  })

  describe('paid dialog', () => {
    beforeEach(() => {
      seedPricedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })
    })

    it('shows the derived total and books the income by default', async () => {
      await request(jobById('J1'), 'paid')

      expect(screen.getByRole('dialog')).toHaveTextContent('€30.00')
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(statusOf('J1')).toBe('paid')
      const transactions = currentEm().transactions.findAll()
      expect(transactions).toHaveLength(1)
      expect(transactions[0].amount).toBe(30)
      expect(transactions[0].refType).toBe('job')
      expect(transactions[0].refId).toBe('J1')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('pays without an income transaction when the box is unchecked', async () => {
      await request(jobById('J1'), 'paid')

      await userEvent.click(screen.getByRole('checkbox'))
      expect(screen.getByRole('checkbox')).not.toBeChecked()
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(statusOf('J1')).toBe('paid')
      expect(currentEm().transactions.findAll()).toHaveLength(0)
    })

    it('re-checks the box for a fresh paid request', async () => {
      const job = jobById('J1')
      renderWithProviders(<FlowHarness job={job} next="paid" />)

      await userEvent.click(screen.getByRole('button', { name: 'request' }))
      await userEvent.click(screen.getByRole('checkbox'))
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      await userEvent.click(screen.getByRole('button', { name: 'request' }))

      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('leaves the job alone when cancelled', async () => {
      await request(jobById('J1'), 'paid')

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(statusOf('J1')).toBe('draft')
      expect(currentEm().transactions.findAll()).toHaveLength(0)
    })
  })

  describe('cancelled dialog', () => {
    it('confirms cancelling a job that was never paid', async () => {
      seedPricedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })

      await request(jobById('J1'), 'cancelled')

      expect(screen.getByRole('dialog')).toHaveTextContent('Mark this job as cancelled?')
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))

      expect(statusOf('J1')).toBe('cancelled')
      expect(currentEm().transactions.findAll()).toHaveLength(0)
    })
  })

  describe('leaving paid', () => {
    beforeEach(() => {
      context = setupShop()
      seedJob(context.tabs, { id: 'J1', client_id: 'CL1', description: 'Vase', status: 'paid' })
    })

    it('warns about duplicate income instead of prompting twice for cancelled', async () => {
      seedPricedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })

      await request(jobById('J1'), 'cancelled')

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('Change status from paid?')
      expect(dialog).toHaveTextContent('another income transaction will be added')
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(statusOf('J1')).toBe('cancelled')
    })

    it('warns when going back to an open status with pricing complete', async () => {
      seedPricedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })

      await request(jobById('J1'), 'in_progress')

      expect(screen.getByRole('dialog')).toHaveTextContent('Change status from paid?')
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(statusOf('J1')).toBe('in_progress')
    })

    it('warns even when pricing is incomplete, since no total is needed', async () => {
      seedPiece(context.tabs, { id: 'P1', job_id: 'J1', name: 'Body' })

      await request(jobById('J1'), 'draft')

      expect(screen.getByRole('dialog')).toHaveTextContent('"Draft"')
      await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(statusOf('J1')).toBe('draft')
    })
  })

  describe('JobStatusFlowDialogs', () => {
    it('renders nothing while no dialog is pending', () => {
      renderWithProviders(<FlowHarness job={jobById('J1')} next="delivered" />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('ignores confirm when no dialog is pending', async () => {
      renderWithProviders(<FlowHarness job={jobById('J1')} next="delivered" />)

      await userEvent.click(screen.getByRole('button', { name: 'confirm-directly' }))

      expect(statusOf('J1')).toBe('draft')
      expect(screen.getByTestId('error')).toHaveTextContent('')
    })
  })
})
