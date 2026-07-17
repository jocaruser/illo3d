import { useEffect, useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogShell } from '@/Component/dialog/DialogShell'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { RequiredIndicator } from '@/Component/form/RequiredIndicator'
import { toast } from '@/Component/Toast'
import { useEntityManager } from '@/Hook/useEntityManager'
import { PieceService } from '@/Service/PieceService'

interface CreatePieceDialogProps {
  open: boolean
  onClose: () => void
  /** Pieces are always created from their job's detail page. */
  jobId: string
  onCreated?: (pieceId: string) => void
}

export function CreatePieceDialog({ open, onClose, jobId, onCreated }: CreatePieceDialogProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const titleId = useId()
  const nameId = useId()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setError('')
  }, [open])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = new PieceService(em).createPiece({ jobId, name })
    if (!result.ok) {
      setError(t(result.error))
      return
    }
    toast.success(t('toast.changeApplied'))
    onCreated?.(result.piece.id)
    onClose()
  }

  return (
    <DialogShell open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-xl font-semibold text-text">
        {t('pieces.createTitle')}
      </h2>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <FormLabel htmlFor={nameId}>
            {t('pieces.name')} <RequiredIndicator />
          </FormLabel>
          <FormInput
            id={nameId}
            value={name}
            placeholder={t('pieces.namePlaceholder')}
            onChange={(event) => setName(event.target.value)}
          />
        </FormGroup>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('pieces.cancel')}
          </button>
          <button type="submit" className="btn-primary">
            {t('pieces.submit')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
