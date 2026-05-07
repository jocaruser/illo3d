import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  Client,
  ClientNoteSeverity,
  Job,
  Piece,
} from '@/types/money'
import { MentionLinkify } from '@/components/MentionLinkify'
import { CLIENT_NOTE_SEVERITY_VALUES } from '@/services/clientNote/severity'
import { ConfirmDialog } from './ConfirmDialog'
import { toast } from '@/lib/toast'
import { Combobox } from './Combobox'
import { FormTextarea } from './Form'
import { AlertStrip } from './AlertBox'

function severityToVariant(severity: ClientNoteSeverity): 'danger' | 'warning' | 'success' | 'primary' | 'secondary' | 'info' {
  switch (severity) {
    case 'danger':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'success':
      return 'success'
    case 'primary':
      return 'primary'
    case 'secondary':
      return 'secondary'
    default:
      return 'info'
  }
}

function severityTagClasses(severity: ClientNoteSeverity): string {
  switch (severity) {
    case 'danger':
      return 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
    case 'primary':
      return 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
    case 'secondary':
      return 'border-border bg-surface text-text'
    default:
      return 'border-border bg-surface-elevated text-text'
  }
}

function isProminentSeverity(s: ClientNoteSeverity): boolean {
  return s !== 'info' && s !== 'secondary'
}

export interface CrmNoteListItem {
  id: string
  body: string
  referenced_entity_ids: string
  severity: ClientNoteSeverity
  created_at: string
}

export type CrmNotesI18nScope = 'clientDetail' | 'jobDetail'

export interface CrmNotesSectionTestIds {
  severityStrip: string
  addButton: string
  row: (noteId: string) => string
}

export interface CrmNotesSectionProps {
  spreadsheetId: string | null
  notes: CrmNoteListItem[]
  clients?: Client[]
  jobs?: Job[]
  pieces?: Piece[]
  onChanged: () => Promise<void>
  i18nScope: CrmNotesI18nScope
  testIds: CrmNotesSectionTestIds
  onCreateNote: (payload: {
    body: string
    severity: ClientNoteSeverity
  }) => Promise<void>
  onUpdateNote: (
    noteId: string,
    payload: { body: string; severity: ClientNoteSeverity },
  ) => Promise<void>
  onDeleteNote: (noteId: string) => Promise<void>
}

export function CrmNotesSection({
  spreadsheetId,
  notes,
  clients = [],
  jobs = [],
  pieces = [],
  onChanged,
  i18nScope,
  testIds,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}: CrmNotesSectionProps) {
  const { t } = useTranslation()
  const tk = (key: string) => t(`${i18nScope}.${key}`)
  const sevLabel = (s: ClientNoteSeverity) =>
    t(`clientDetail.severity.${s}` as const)

  const prominent = notes.filter((n) => isProminentSeverity(n.severity))

  const [draftBody, setDraftBody] = useState('')
  const [draftSeverity, setDraftSeverity] =
    useState<ClientNoteSeverity>('info')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editSeverity, setEditSeverity] =
    useState<ClientNoteSeverity>('info')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const startEdit = (n: CrmNoteListItem) => {
    setEditingId(n.id)
    setEditBody(n.body)
    setEditSeverity(n.severity)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const handleAdd = async () => {
    if (!spreadsheetId || !draftBody.trim()) return
    setAdding(true)
    try {
      await onCreateNote({
        body: draftBody,
        severity: draftSeverity,
      })
      setDraftBody('')
      setDraftSeverity('info')
      await onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setAdding(false)
    }
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!spreadsheetId) return
    setBusyId(noteId)
    try {
      await onUpdateNote(noteId, {
        body: editBody,
        severity: editSeverity,
      })
      setEditingId(null)
      await onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!spreadsheetId || !deleteId) return
    setBusyId(deleteId)
    try {
      await onDeleteNote(deleteId)
      setDeleteId(null)
      if (editingId === deleteId) setEditingId(null)
      await onChanged()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mb-8">
      <h3 className="mb-3 text-lg font-semibold text-text">
        {tk('notesTitle')}
      </h3>

      {prominent.length > 0 ? (
        <div
          className="mb-4 flex flex-col gap-2"
          data-testid={testIds.severityStrip}
        >
          {prominent.map((n) => (
            <AlertStrip
              key={n.id}
              variant={severityToVariant(n.severity)}
            >
              <span className="font-semibold">{sevLabel(n.severity)}:</span>{' '}
              <span className="line-clamp-2">
                <MentionLinkify
                  text={n.body || '—'}
                  clients={clients}
                  jobs={jobs}
                  pieces={pieces}
                />
              </span>
            </AlertStrip>
          ))}
        </div>
      ) : null}

      <div className="mb-6 rounded-lg border border-border bg-surface-elevated p-4 shadow">
        <p className="mb-2 text-sm font-medium text-text">
          {tk('addNote')}
        </p>
        <FormTextarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          rows={2}
          disabled={adding || !spreadsheetId}
          placeholder={tk('noteBodyPlaceholder')}
        />
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-text">
            {tk('severityLabel')}
            <Combobox
              items={CLIENT_NOTE_SEVERITY_VALUES}
              value={draftSeverity}
              onChange={(key) => setDraftSeverity(key as ClientNoteSeverity)}
              getKey={(s) => s}
              getLabel={(s) => sevLabel(s)}
              disabled={adding || !spreadsheetId}
              searchable={false}
            />
          </label>
          <button
            type="button"
            data-testid={testIds.addButton}
            disabled={adding || !spreadsheetId || !draftBody.trim()}
            onClick={() => void handleAdd()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? t('common.submitting') : tk('saveNote')}
          </button>
        </div>
      </div>

      <ul className="space-y-3">
        {notes.map((n) => (
          <li
            key={n.id}
            className="rounded-lg border border-border bg-surface-elevated p-4 shadow"
            data-testid={testIds.row(n.id)}
          >
            {editingId === n.id ? (
              <div className="space-y-2">
                <FormTextarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  disabled={busyId === n.id}
                />
                <Combobox
                  items={CLIENT_NOTE_SEVERITY_VALUES}
                  value={editSeverity}
                  onChange={(key) => setEditSeverity(key as ClientNoteSeverity)}
                  getKey={(s) => s}
                  getLabel={(s) => sevLabel(s)}
                  disabled={busyId === n.id}
                  searchable={false}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={() => void handleSaveEdit(n.id)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    {t('clients.save')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={cancelEdit}
                    className="rounded-lg border border-border px-3 py-1 text-sm"
                  >
                    {t('clients.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${severityTagClasses(n.severity)}`}
                  >
                    {sevLabel(n.severity)}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text">
                    <MentionLinkify
                      text={n.body || '—'}
                      clients={clients}
                      jobs={jobs}
                      pieces={pieces}
                    />
                  </p>
                  <p className="mt-1 text-xs text-text-muted/60">{n.created_at}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => startEdit(n)}
                    className="text-sm text-primary hover:text-blue-800 dark:text-blue-200"
                  >
                    {t('clients.edit')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => setDeleteId(n.id)}
                    className="text-sm text-danger hover:text-red-800 dark:text-red-200"
                  >
                    {t('clients.delete')}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title={tk('deleteNoteTitle')}
        message={tk('deleteNoteMessage')}
        confirmLabel={t('clients.delete')}
        cancelLabel={t('clients.cancel')}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
