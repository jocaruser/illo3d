import { useEffect, useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { DialogShell } from '@/Component/dialog/DialogShell'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { FormTextarea } from '@/Component/form/FormTextarea'
import { RequiredIndicator } from '@/Component/form/RequiredIndicator'
import { toast } from '@/Component/Toast'
import type { Client } from '@/Entity/Client'
import { useEntityManager } from '@/Hook/useEntityManager'
import { ClientService, type ClientInput } from '@/Service/ClientService'

interface CreateClientDialogProps {
  open: boolean
  onClose: () => void
  /** Prefills the form and switches to update mode. */
  client?: Client | null
  /** Receives the persisted client after a successful create or update. */
  onSaved?: (client: Client, mode: 'create' | 'edit') => void
}

const emptyForm: ClientInput = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  preferredContact: '',
  leadSource: '',
  address: '',
}

function formFor(client: Client | null | undefined): ClientInput {
  if (client === null || client === undefined) return emptyForm
  return {
    name: client.name,
    email: client.email,
    phone: client.phone,
    notes: client.notes,
    preferredContact: client.preferredContact,
    leadSource: client.leadSource,
    address: client.address,
  }
}

export function CreateClientDialog({ open, onClose, client, onSaved }: CreateClientDialogProps) {
  const { t } = useTranslation()
  const em = useEntityManager()
  const titleId = useId()
  const isEdit = client !== null && client !== undefined
  const [form, setForm] = useState<ClientInput>(() => formFor(client))
  const [error, setError] = useState('')

  // Re-seed whenever the dialog opens so a reused instance never shows stale input.
  useEffect(() => {
    if (!open) return
    setForm(formFor(client))
    setError('')
  }, [open, client])

  const update = (field: keyof ClientInput) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const service = new ClientService(em)
    const result =
      client !== null && client !== undefined
        ? service.updateClient(client.id, form)
        : service.createClient(form)
    if (!result.ok) {
      setError(t(result.error))
      return
    }
    toast.success(t('toast.saveSuccess'))
    onSaved?.(result.client, isEdit ? 'edit' : 'create')
    onClose()
  }

  return (
    <DialogShell open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="font-display text-xl font-semibold text-text">
        {isEdit ? t('clients.editClient') : t('clients.addClient')}
      </h2>
      <form className="mt-4 space-y-3" onSubmit={handleSubmit} noValidate>
        <FormGroup>
          <FormLabel htmlFor="client-name">
            {t('clients.name')} <RequiredIndicator />
          </FormLabel>
          <FormInput
            id="client-name"
            value={form.name}
            placeholder={t('clients.namePlaceholder')}
            onChange={(event) => update('name')(event.target.value)}
          />
        </FormGroup>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormGroup>
            <FormLabel htmlFor="client-email">{t('clients.email')}</FormLabel>
            <FormInput
              id="client-email"
              type="email"
              value={form.email}
              onChange={(event) => update('email')(event.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="client-phone">{t('clients.phone')}</FormLabel>
            <FormInput
              id="client-phone"
              value={form.phone}
              onChange={(event) => update('phone')(event.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="client-preferred-contact">{t('clients.preferredContact')}</FormLabel>
            <FormInput
              id="client-preferred-contact"
              value={form.preferredContact}
              onChange={(event) => update('preferredContact')(event.target.value)}
            />
          </FormGroup>
          <FormGroup>
            <FormLabel htmlFor="client-lead-source">{t('clients.leadSource')}</FormLabel>
            <FormInput
              id="client-lead-source"
              value={form.leadSource}
              onChange={(event) => update('leadSource')(event.target.value)}
            />
          </FormGroup>
        </div>

        <FormGroup>
          <FormLabel htmlFor="client-address">{t('clients.address')}</FormLabel>
          <FormInput
            id="client-address"
            value={form.address}
            onChange={(event) => update('address')(event.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="client-notes">{t('clients.notes')}</FormLabel>
          <FormTextarea
            id="client-notes"
            rows={3}
            value={form.notes}
            onChange={(event) => update('notes')(event.target.value)}
          />
        </FormGroup>

        <FormError message={error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t('clients.cancel')}
          </button>
          <button type="submit" className="btn-primary">
            {isEdit ? t('clients.save') : t('clients.submit')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
