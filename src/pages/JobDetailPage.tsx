import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { ListTableSearchField } from '@/components/list-table/ListTableSearchField'
import { JobDetailMetadata } from '@/components/JobDetailMetadata'
import { JobDetailPieceDialogs } from '@/components/JobDetailPieceDialogs'
import { JobDetailPiecesSection } from '@/components/JobDetailPiecesSection'
import { jobOverallRiskFactor } from '@/utils/jobOverallRiskFactor'
import { useJobStatusFlow } from '@/hooks/useJobStatusFlow'
import { usePieceHashScroll } from '@/hooks/usePieceHashScroll'
import { usePieceStatusFlow } from '@/hooks/usePieceStatusFlow'
import type {
  JobNote,
} from '@/types/money'
import { jobPricingState } from '@/utils/jobPiecePricing'
import { jobMaterialCost } from '@/utils/jobMaterialCost'
import { jobFilamentGrams } from '@/utils/jobFilamentGrams'
import { jobConsumableUnits } from '@/utils/jobConsumableUnits'
import { jobDueDateGradient } from '@/utils/jobDueDateGradient'
import { buildMaterialsSummary } from '@/utils/jobMaterialsSummary'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { NotFoundCard } from '@/components/NotFoundCard'

export function JobDetailPage() {
  const { t } = useTranslation()
  const { jobId = '' } = useParams<{ jobId: string }>()
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()

  const {
    jobs,
    clients,
    pieces: allPieces,
    pieceItems,
    inventory,
    lots,
    crmNotes,
    tags,
    tagLinks,
  } = useWorkbookEntities()

  const {
    handleStatusSelect: handleJobStatusSelect,
    statusError: jobStatusError,
    statusUpdatingId: jobStatusUpdatingId,
    statusDialogs: jobStatusDialogs,
  } = useJobStatusFlow(spreadsheetId)

  const jobNotes = useMemo((): JobNote[] => {
    const list: JobNote[] = []
    for (const n of crmNotes) {
      if (n.entity_type !== 'job' || n.entity_id !== jobId) continue
      list.push({
        id: n.id,
        job_id: n.entity_id,
        body: n.body,
        referenced_entity_ids: n.referenced_entity_ids,
        severity: n.severity,
        created_at: n.created_at,
      })
    }
    return list.sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
  }, [crmNotes, jobId])

  const job = useMemo(() => jobs.find((j) => j.id === jobId), [jobs, jobId])

  const pieces = useMemo(
    () => allPieces.filter((p) => p.job_id === jobId),
    [allPieces, jobId]
  )

  const jobPricing = useMemo(
    () => (job ? jobPricingState(job.id, allPieces) : { kind: 'incomplete' as const }),
    [job, allPieces]
  )

  const materialCost = useMemo(
    () => jobMaterialCost(pieces, pieceItems, inventory, lots),
    [pieces, pieceItems, inventory, lots]
  )

  const filamentGrams = useMemo(
    () => jobFilamentGrams(pieces, pieceItems, inventory),
    [pieces, pieceItems, inventory]
  )

  const consumableUnits = useMemo(
    () => jobConsumableUnits(pieces, pieceItems, inventory),
    [pieces, pieceItems, inventory]
  )

  const dueDate = useMemo(
    () => (job ? jobDueDateGradient(job) : null),
    [job]
  )

  const materialsSummary = useMemo(
    () =>
      job
        ? buildMaterialsSummary(job.id, allPieces, pieceItems, inventory, lots)
        : [],
    [job, allPieces, pieceItems, inventory, lots]
  )

  const overallRiskFactor = useMemo(
    () =>
      job ? jobOverallRiskFactor(pieces, pieceItems, inventory) : null,
    [job, pieces, pieceItems, inventory]
  )

  const [expandedPieceIds, setExpandedPieceIds] = useState<Set<string>>(new Set())
  const [lineRequirementMessage, setLineRequirementMessage] = useState<
    string | null
  >(null)
  const [piecesUI, setPiecesUI] = useState({ createOpen: false, query: '' })
  const {
    pieceStatus,
    setPieceStatus,
    handlePieceStatusSelect,
    commitPieceStatusChange,
    consumeShortfall,
  } = usePieceStatusFlow(spreadsheetId, pieceItems, inventory, setLineRequirementMessage)

  const searchField = useMemo(
    () => (
      <ListTableSearchField
        value={piecesUI.query}
        onChange={(value) => setPiecesUI((prev) => ({ ...prev, query: value }))}
        placeholder={t('listTable.searchPlaceholder')}
        ariaLabel={t('listTable.searchAria')}
      />
    ),
    [piecesUI.query, t]
  )

  usePieceHashScroll(
    workbookStatus === 'ready' && !!job,
    (pieceId) =>
      setExpandedPieceIds((prev) => new Set([...prev, pieceId]))
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {workbookStatus === 'ready' && jobId && !job && (
        <NotFoundCard
          message={t('jobs.jobNotFound')}
          backTo="/jobs"
          backLabel={t('jobs.backToList')}
        />
      )}

      {workbookStatus === 'ready' && job && (
        <div>
          <JobDetailMetadata
            job={job}
            clients={clients}
            jobs={jobs}
            allPieces={allPieces}
            jobPricing={jobPricing}
            materialCost={materialCost}
            dueDate={dueDate}
            filamentGrams={filamentGrams}
            consumableUnits={consumableUnits}
            overallRiskFactor={overallRiskFactor}
            spreadsheetId={spreadsheetId}
            jobStatusUpdatingId={jobStatusUpdatingId}
            jobStatusError={jobStatusError}
            materialsSummary={materialsSummary}
            tags={tags}
            tagLinks={tagLinks}
            jobNotes={jobNotes}
            onStatusChange={handleJobStatusSelect}
          />

          <JobDetailPiecesSection
            title={t('pieces.title')}
            searchField={searchField}
            addButtonLabel={t('pieces.addPiece')}
            onAddClick={() => setPiecesUI({ createOpen: true, query: '' })}
            lineRequirementMessage={lineRequirementMessage}
            pieces={pieces}
            query={piecesUI.query}
            jobs={jobs}
            pieceItems={pieceItems}
            inventory={inventory}
            lots={lots}
            spreadsheetId={spreadsheetId}
            expandedPieceIds={expandedPieceIds}
            onToggleExpand={(id) =>
              setExpandedPieceIds((prev) => {
                const next = new Set(prev)
                if (next.has(id)) {
                  next.delete(id)
                } else {
                  next.add(id)
                }
                return next
              })
            }
            onAddPieceItemExpand={(pieceId) =>
              setExpandedPieceIds((prev) => new Set([...prev, pieceId]))
            }
            onStatusChange={handlePieceStatusSelect}
            statusUpdatingId={pieceStatus.updatingId}
          />
        </div>
      )}

      <JobDetailPieceDialogs
        spreadsheetId={spreadsheetId}
        jobs={jobs}
        jobId={jobId}
        createOpen={piecesUI.createOpen}
        onCloseCreate={() =>
          setPiecesUI((prev) => ({ ...prev, createOpen: false }))
        }
        pieceStatus={pieceStatus}
        onSetPieceStatus={(update) =>
          setPieceStatus((prev) => ({ ...prev, ...update }))
        }
        onCommitPieceStatus={commitPieceStatusChange}
        consumeShortfall={consumeShortfall}
      />

      {jobStatusDialogs}
    </div>
  )
}
