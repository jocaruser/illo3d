import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, Job } from '@/types/money'
import { formatCurrency } from '@/utils/money'
import { StatusDropdown } from './StatusDropdown'

function clientName(clients: Client[], clientId: string): string {
  const c = clients.find((x) => x.id === clientId)
  return c?.name ?? clientId
}

function formatJobPrice(price: number | undefined): string {
  if (price === undefined || price === null || Number.isNaN(price)) {
    return '—'
  }
  return formatCurrency(price)
}

interface JobsTableProps {
  jobs: Job[]
  clients: Client[]
  onStatusSelect: (job: Job, nextStatus: Job['status']) => void
  statusUpdatingId: string | null
}

export function JobsTable({
  jobs,
  clients,
  onStatusSelect,
  statusUpdatingId,
}: JobsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colId')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colClient')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colDescription')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colStatus')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colPrice')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
              {t('jobs.colCreated')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <Link
                  to={`/jobs/${job.id}`}
                  data-testid={`job-detail-link-${job.id}`}
                  className="font-medium text-blue-600 hover:text-blue-800"
                  aria-label={t('jobs.idLinkAria', { id: job.id })}
                >
                  {job.id}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {clientName(clients, job.client_id)}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">
                {job.description}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                <StatusDropdown
                  jobId={job.id}
                  status={job.status}
                  disabled={statusUpdatingId === job.id}
                  onChange={(next) => onStatusSelect(job, next)}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-700">
                {formatJobPrice(job.price)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {job.created_at}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
