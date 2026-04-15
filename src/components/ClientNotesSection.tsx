import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClientNote, ClientNoteSeverity } from '@/types/money'
import { CLIENT_NOTE_SEVERITY_VALUES } from '@/services/clientNote/severity'
import { createClientNote } from '@/services/clientNote/createClientNote'
import { updateClientNote } from '@/services/clientNote/updateClientNote'
import { deleteClientNote } from '@/services/clientNote/deleteClientNote'
import { ConfirmDialog } from './ConfirmDialog'

function stripSeverityClasses(severity: ClientNoteSeverity): string {
  switch (severity) {
    case 'danger':
      return 'border-red-200 bg-red-50 text-red-900'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-950'
    case 'success':
      return 'border-green-200 bg-green-50 text-green-900'
    case 'primary':
      return 'border-blue-200 bg-blue-50 text-blue-900'
    case 'secondary':
      return 'border-gray-200 bg-gray-50 text-gray-800'
    default:
      return 'border-gray-200 bg-white text-gray-800'
  }
}

function isProminentSeverity(s: ClientNoteSeverity): boolean {
  return s !== 'info' && s !== 'secondary'
}

interface ClientNotesSectionProps {
  spreadsheetId: string | null
  clientId: string
  notes: ClientNote[]
  onChanged: () => Promise<void>
}

export function ClientNotesSection({
  spreadsheetId,
  clientId,
  notes,
  onChanged,
}: ClientNotesSectionProps) {
  const { t } = useTranslation()
  const clientNotes = notes.filter((n) => n.client_id === clientId)
  const prominent = clientNotes.filter((n) => isProminentSeverity(n.severity))

  const [draftBody, setDraftBody] = useState('')
  const [draftSeverity, setDraftSeverity] = useState<ClientNoteSeverity>('info')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editSeverity, setEditSeverity] = useState<ClientNoteSeverity>('info')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const startEdit = (n: ClientNote) => {
    setEditingId(n.id)
    setEditBody(n.body)
    setEditSeverity(n.severity)
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const handleAdd = async () => {
    if (!spreadsheetId || !draftBody.trim()) return
    setAdding(true)
    setError(null)
    try {
      await createClientNote(spreadsheetId, {
        client_id: clientId,
        body: draftBody,
        severity: draftSeverity,
      })
      setDraftBody('')
      setDraftSeverity('info')
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setAdding(false)
    }
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!spreadsheetId) return
    setBusyId(noteId)
    setError(null)
    try {
      await updateClientNote(spreadsheetId, noteId, {
        body: editBody,
        severity: editSeverity,
      })
      setEditingId(null)
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!spreadsheetId || !deleteId) return
    setBusyId(deleteId)
    setError(null)
    try {
      await deleteClientNote(spreadsheetId, deleteId)
      setDeleteId(null)
      if (editingId === deleteId) setEditingId(null)
      await onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('wizard.errorGeneric'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mb-8">
      <h3 className="mb-3 text-xl font-semibold text-gray-800">
        {t('clientDetail.notesTitle')}
      </h3>

      {prominent.length > 0 ? (
        <div
          className="mb-4 flex flex-col gap-2"
          data-testid="client-notes-severity-strip"
        >
          {prominent.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border px-3 py-2 text-sm ${stripSeverityClasses(n.severity)}`}
            >
              <span className="font-semibold">
                {t(`clientDetail.severity.${n.severity}`)}:
              </span>{' '}
              <span className="line-clamp-2">{n.body || '—'}</span>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow">
        <p className="mb-2 text-sm font-medium text-gray-700">
          {t('clientDetail.addNote')}
        </p>
        <textarea
          value={draftBody}
          onChange={(e) => setDraftBody(e.target.value)}
          rows={2}
          disabled={adding || !spreadsheetId}
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={t('clientDetail.noteBodyPlaceholder')}
        />
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-700">
            {t('clientDetail.severityLabel')}
            <select
              value={draftSeverity}
              onChange={(e) =>
                setDraftSeverity(e.target.value as ClientNoteSeverity)
              }
              disabled={adding || !spreadsheetId}
              className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
            >
              {CLIENT_NOTE_SEVERITY_VALUES.map((s) => (
                <option key={s} value={s}>
                  {t(`clientDetail.severity.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            data-testid="client-note-add"
            disabled={
              adding || !spreadsheetId || !draftBody.trim()
            }
            onClick={() => void handleAdd()}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? t('common.submitting') : t('clientDetail.saveNote')}
          </button>
        </div>
      </div>

      <ul className="space-y-3">
        {clientNotes.map((n) => (
          <li
            key={n.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow"
            data-testid={`client-note-row-${n.id}`}
          >
            {editingId === n.id ? (
              <div className="space-y-2">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={2}
                  disabled={busyId === n.id}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={editSeverity}
                  onChange={(e) =>
                    setEditSeverity(e.target.value as ClientNoteSeverity)
                  }
                  disabled={busyId === n.id}
                  className="rounded border border-gray-300 px-2 py-1 text-sm"
                >
                  {CLIENT_NOTE_SEVERITY_VALUES.map((s) => (
                    <option key={s} value={s}>
                      {t(`clientDetail.severity.${s}`)}
                    </option>
                  ))}
                </select>
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
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm"
                  >
                    {t('clients.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${stripSeverityClasses(n.severity)}`}
                  >
                    {t(`clientDetail.severity.${n.severity}`)}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                    {n.body || '—'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{n.created_at}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => startEdit(n)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {t('clients.edit')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => setDeleteId(n.id)}
                    className="text-sm text-red-600 hover:text-red-800"
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
        title={t('clientDetail.deleteNoteTitle')}
        message={t('clientDetail.deleteNoteMessage')}
        confirmLabel={t('clients.delete')}
        cancelLabel={t('clients.cancel')}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
