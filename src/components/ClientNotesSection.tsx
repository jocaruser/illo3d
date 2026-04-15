import { useMemo } from 'react'
import type { Client, ClientNote, Job, Piece } from '@/types/money'
import { createClientNote } from '@/services/clientNote/createClientNote'
import { updateClientNote } from '@/services/clientNote/updateClientNote'
import { deleteClientNote } from '@/services/clientNote/deleteClientNote'
import {
  CrmNotesSection,
  type CrmNotesSectionTestIds,
} from '@/components/CrmNotesSection'

const CLIENT_NOTES_TEST_IDS: CrmNotesSectionTestIds = {
  severityStrip: 'client-notes-severity-strip',
  addButton: 'client-note-add',
  row: (noteId: string) => `client-note-row-${noteId}`,
}

interface ClientNotesSectionProps {
  spreadsheetId: string | null
  clientId: string
  notes: ClientNote[]
  clients?: Client[]
  jobs?: Job[]
  pieces?: Piece[]
  onChanged: () => Promise<void>
}

export function ClientNotesSection({
  spreadsheetId,
  clientId,
  notes,
  clients = [],
  jobs = [],
  pieces = [],
  onChanged,
}: ClientNotesSectionProps) {
  const filtered = useMemo(
    () => notes.filter((n) => n.client_id === clientId),
    [notes, clientId],
  )

  return (
    <CrmNotesSection
      spreadsheetId={spreadsheetId}
      notes={filtered}
      clients={clients}
      jobs={jobs}
      pieces={pieces}
      onChanged={onChanged}
      i18nScope="clientDetail"
      testIds={CLIENT_NOTES_TEST_IDS}
      onCreateNote={async (payload) => {
        if (!spreadsheetId) return
        await createClientNote(spreadsheetId, {
          client_id: clientId,
          ...payload,
        })
      }}
      onUpdateNote={async (noteId, payload) => {
        if (!spreadsheetId) return
        await updateClientNote(spreadsheetId, noteId, payload)
      }}
      onDeleteNote={async (noteId) => {
        if (!spreadsheetId) return
        await deleteClientNote(spreadsheetId, noteId)
      }}
    />
  )
}
