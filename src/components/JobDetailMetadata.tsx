import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Client, Job, Piece, JobNote, Tag, TagLink } from '@/types/money'
import type { buildMaterialsSummary } from '@/utils/jobMaterialsSummary'
import { JobDetailHeader } from './JobDetailHeader'
import { JobMaterialsSummary } from './JobMaterialsSummary'
import { JobTagsSection } from './JobTagsSection'
import { JobNotesSection } from './JobNotesSection'
import { jobPricingState } from '@/utils/jobPiecePricing'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import { jobOverallRiskFactor } from '@/utils/jobOverallRiskFactor'

interface JobDetailMetadataProps {
  job: Job
  clients: Client[]
  jobs: Job[]
  allPieces: Piece[]
  jobPricing: ReturnType<typeof jobPricingState>
  materialCost: number
  dueDate: ReturnType<typeof jobDueDateGradient> | null
  filamentGrams: number
  consumableUnits: number
  overallRiskFactor: ReturnType<typeof jobOverallRiskFactor>
  spreadsheetId: string | null
  jobStatusUpdatingId: string | null
  jobStatusError: string | null
  materialsSummary: ReturnType<typeof buildMaterialsSummary>
  tags: Tag[]
  tagLinks: TagLink[]
  jobNotes: JobNote[]
  onStatusChange: (job: Job, status: Job['status']) => void
}

export function JobDetailMetadata({
  job,
  clients,
  jobs,
  allPieces,
  jobPricing,
  materialCost,
  dueDate,
  filamentGrams,
  consumableUnits,
  overallRiskFactor,
  spreadsheetId,
  jobStatusUpdatingId,
  jobStatusError,
  materialsSummary,
  tags,
  tagLinks,
  jobNotes,
  onStatusChange,
}: JobDetailMetadataProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="mb-4">
        <Link
          to="/jobs"
          data-testid="entity-detail-back"
          className="text-sm font-medium text-primary hover:text-blue-800 dark:text-blue-200"
        >
          ← {t('jobs.backToList')}
        </Link>
      </div>

      <JobDetailHeader
        job={job}
        clients={clients}
        allPieces={allPieces}
        jobPricing={jobPricing}
        materialCost={materialCost}
        dueDate={dueDate}
        filamentGrams={filamentGrams}
        consumableUnits={consumableUnits}
        overallRiskFactor={overallRiskFactor}
        spreadsheetId={spreadsheetId}
        jobStatusUpdatingId={jobStatusUpdatingId}
        onStatusChange={onStatusChange}
      />

      {jobStatusError ? (
        <div
          className="mb-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-900 dark:text-red-200"
          role="alert"
        >
          {jobStatusError}
        </div>
      ) : null}

      <JobMaterialsSummary rows={materialsSummary} />

      <JobTagsSection
        spreadsheetId={spreadsheetId}
        jobId={job.id}
        tags={tags}
        tagLinks={tagLinks}
        onChanged={async () => {}}
      />

      <JobNotesSection
        spreadsheetId={spreadsheetId}
        jobId={job.id}
        notes={jobNotes}
        clients={clients}
        jobs={jobs}
        pieces={allPieces}
        onChanged={async () => {}}
      />
    </>
  )
}
