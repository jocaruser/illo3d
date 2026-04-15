import { useMemo } from 'react'
import type { Client, Job, JobNote, Piece } from '@/types/money'
import { createJobNote } from '@/services/jobNote/createJobNote'
import { updateJobNote } from '@/services/jobNote/updateJobNote'
import { deleteJobNote } from '@/services/jobNote/deleteJobNote'
import {
  CrmNotesSection,
  type CrmNotesSectionTestIds,
} from '@/components/CrmNotesSection'

const JOB_NOTES_TEST_IDS: CrmNotesSectionTestIds = {
  severityStrip: 'job-notes-severity-strip',
  addButton: 'job-note-add',
  row: (noteId: string) => `job-note-row-${noteId}`,
}

interface JobNotesSectionProps {
  spreadsheetId: string | null
  jobId: string
  notes: JobNote[]
  clients?: Client[]
  jobs?: Job[]
  pieces?: Piece[]
  onChanged: () => Promise<void>
}

export function JobNotesSection({
  spreadsheetId,
  jobId,
  notes,
  clients = [],
  jobs = [],
  pieces = [],
  onChanged,
}: JobNotesSectionProps) {
  const filtered = useMemo(
    () => notes.filter((n) => n.job_id === jobId),
    [notes, jobId],
  )

  return (
    <CrmNotesSection
      spreadsheetId={spreadsheetId}
      notes={filtered}
      clients={clients}
      jobs={jobs}
      pieces={pieces}
      onChanged={onChanged}
      i18nScope="jobDetail"
      testIds={JOB_NOTES_TEST_IDS}
      onCreateNote={async (payload) => {
        if (!spreadsheetId) return
        await createJobNote(spreadsheetId, {
          job_id: jobId,
          ...payload,
        })
      }}
      onUpdateNote={async (noteId, payload) => {
        if (!spreadsheetId) return
        await updateJobNote(spreadsheetId, noteId, payload)
      }}
      onDeleteNote={async (noteId) => {
        if (!spreadsheetId) return
        await deleteJobNote(spreadsheetId, noteId)
      }}
    />
  )
}
