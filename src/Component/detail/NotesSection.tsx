import { useCallback, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertStrip } from '@/Component/AlertStrip'
import { ConfirmDialog } from '@/Component/dialog/ConfirmDialog'
import { FormError } from '@/Component/form/FormError'
import { FormTextarea } from '@/Component/form/FormTextarea'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import { MentionLinkify } from '@/Component/MentionLinkify'
import { RelativeTime } from '@/Component/RelativeTime'
import { Select } from '@/Component/Select'
import { toast } from '@/Component/Toast'
import type { AlertVariant } from '@/Component/alertVariants'
import {
  NOTE_SEVERITIES,
  type CrmNote,
  type NoteEntityType,
} from '@/Entity/CrmNote'
import { useEntityManager } from '@/Hook/useEntityManager'
import { NoteService } from '@/Service/NoteService'

interface NotesSectionProps {
  entityType: NoteEntityType
  entityId: string
  /** An archived entity's notes are history: shown, never edited. */
  readOnly?: boolean
}

export function NotesSection({
  entityType,
  entityId,
  readOnly = false,
}: NotesSectionProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const [revision, bump] = useReducer((count: number) => count + 1, 0)
  const [body, setBody] = useState('')
  const [severity, setSeverity] = useState<string>('info')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editSeverity, setEditSeverity] = useState<string>('info')
  const [editError, setEditError] = useState('')
  const [deleting, setDeleting] = useState<CrmNote | null>(null)

  const prefix = entityType === 'client' ? 'clientDetail' : 'jobDetail'
  const service = useMemo(() => new NoteService(em), [em])
  const notes = useMemo(() => {
    void revision // the workbook mutates in place; `revision` signals a change
    return em.crmNotes.findActiveByEntity(entityType, entityId)
  }, [em, entityType, entityId, revision])
  const prominent = useMemo(
    () => notes.filter((note) => note.isProminent()),
    [notes]
  )

  const severityOptions = useMemo(
    () =>
      NOTE_SEVERITIES.map((value) => ({
        value,
        label: t(`clientDetail.severity.${value}`),
      })),
    [t]
  )

  const resolvePieceJob = useCallback(
    (pieceId: string) => em.pieces.find(pieceId)?.jobId ?? null,
    [em]
  )

  const add = () => {
    const result = service.createNote(entityType, entityId, body, severity)
    if (!result.ok) {
      setError(t(result.error))
      return
    }
    setBody('')
    setSeverity('info')
    setError('')
    toast.success(t('clientDetail.noteSaved'))
    bump()
  }

  const startEdit = (note: CrmNote) => {
    setEditingId(note.id)
    setEditBody(note.body)
    setEditSeverity(note.severity)
    setEditError('')
  }

  const saveEdit = (noteId: string) => {
    const result = service.updateNote(noteId, editBody, editSeverity)
    if (!result.ok) {
      setEditError(t(result.error))
      return
    }
    setEditingId(null)
    toast.success(t('clientDetail.noteSaved'))
    bump()
  }

  const confirmDelete = (note: CrmNote) => {
    service.deleteNote(note.id)
    setDeleting(null)
    bump()
  }

  return (
    <section className="space-y-3" data-testid={`${entityType}-notes-section`}>
      <SectionHeading>{t(`${prefix}.notesTitle`)}</SectionHeading>

      {prominent.length > 0 && (
        <div
          className="space-y-1"
          data-testid={`${entityType}-notes-severity-strip`}
        >
          {prominent.map((note) => (
            <AlertStrip key={note.id} variant={note.severity as AlertVariant}>
              <MentionLinkify
                text={note.body}
                resolvePieceJob={resolvePieceJob}
              />
            </AlertStrip>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="space-y-2 rounded-lg border border-border bg-surface-elevated p-3">
          <FormTextarea
            rows={2}
            value={body}
            aria-label={t(`${prefix}.addNote`)}
            placeholder={t(`${prefix}.noteBodyPlaceholder`)}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <Select
                aria-label={t(`${prefix}.severityLabel`)}
                options={severityOptions}
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-primary"
              data-testid={`${entityType}-note-add`}
              onClick={add}
            >
              {t(`${prefix}.addNote`)}
            </button>
          </div>
          <FormError message={error} />
        </div>
      )}

      <ul className="space-y-2">
        {notes.map((note) => (
          <li
            key={note.id}
            data-testid={`${entityType}-note-row-${note.id}`}
            className="rounded-lg border border-border bg-surface-elevated p-3"
          >
            {editingId === note.id ? (
              <div className="space-y-2">
                <FormTextarea
                  rows={2}
                  value={editBody}
                  aria-label={`${t(`${prefix}.noteBodyPlaceholder`)} ${note.id}`}
                  onChange={(event) => setEditBody(event.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-40">
                    <Select
                      aria-label={`${t(`${prefix}.severityLabel`)} ${note.id}`}
                      options={severityOptions}
                      value={editSeverity}
                      onChange={(event) => setEditSeverity(event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => saveEdit(note.id)}
                  >
                    {t(`${prefix}.saveNote`)}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditingId(null)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
                <FormError message={editError} />
              </div>
            ) : (
              <div className="flex flex-wrap items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-sm text-text">
                    <MentionLinkify
                      text={note.body}
                      resolvePieceJob={resolvePieceJob}
                    />
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {t(`clientDetail.severity.${note.severity}`)}
                    {note.createdAt !== '' && (
                      <>
                        {' · '}
                        <RelativeTime value={note.createdAt} />
                      </>
                    )}
                  </p>
                </div>
                {!readOnly && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() => startEdit(note)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-xs"
                      onClick={() => setDeleting(note)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {deleting !== null && (
        <ConfirmDialog
          open
          title={t(`${prefix}.deleteNoteTitle`)}
          message={t(`${prefix}.deleteNoteMessage`)}
          confirmLabel={t('common.delete')}
          onConfirm={() => confirmDelete(deleting)}
          onCancel={() => setDeleting(null)}
        />
      )}
    </section>
  )
}
