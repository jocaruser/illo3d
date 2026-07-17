import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  InformationCircleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { AlertBox } from '@/Component/AlertBox'
import { LoadingSpinner } from '@/Component/LoadingSpinner'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import type { AuthUser } from '@/Store/authStore'

const FOLDER_ID_INPUT_ID = 'wizard-folder-id'

interface GoogleDriveStepProps {
  user: AuthUser | null
  busy?: boolean
  onCreate: () => void
  onOpen: (folderId: string) => void
  onCancel: () => void
}

/**
 * Post-sign-in Drive screen: create a shop, or open one by folder id. Browsing
 * for an existing folder needs a Drive picker we do not ship yet, so that
 * button is present but disabled — the id field is the working path.
 */
export function GoogleDriveStep({
  user,
  busy = false,
  onCreate,
  onOpen,
  onCancel,
}: GoogleDriveStepProps) {
  const { t } = useTranslation()
  const [folderId, setFolderId] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = folderId.trim()
    if (trimmed === '') {
      setValidationError(t('wizard.folderIdEmpty'))
      return
    }
    setValidationError(null)
    onOpen(trimmed)
  }

  return (
    <div>
      <h1 className="text-center font-display text-3xl font-semibold text-text">
        {t('wizard.googleDriveTitle')}
      </h1>

      {user !== null && <SignedInAs user={user} />}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          data-testid="wizard-google-create"
          className="btn-primary"
          disabled={busy}
          onClick={onCreate}
        >
          {busy && <LoadingSpinner />}
          {busy ? t('wizard.creating') : t('wizard.createNewShop')}
        </button>
        <button
          type="button"
          data-testid="wizard-google-open-picker"
          className="btn-secondary"
          disabled
          title={t('wizard.openExistingComingSoon')}
        >
          {t('wizard.openExistingShop')}
        </button>
      </div>
      <p className="mt-2 text-xs text-text-muted">
        {t('wizard.openExistingComingSoon')}
      </p>

      <form className="mt-6" onSubmit={submit} noValidate>
        <FormGroup>
          <FormLabel htmlFor={FOLDER_ID_INPUT_ID}>
            {t('wizard.folderIdLabel')}
          </FormLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <FormInput
              id={FOLDER_ID_INPUT_ID}
              data-testid="wizard-folder-id"
              value={folderId}
              disabled={busy}
              placeholder={t('wizard.folderIdPlaceholder')}
              onChange={(event) => setFolderId(event.target.value)}
            />
            <button
              type="submit"
              data-testid="wizard-google-open-by-id"
              className="btn-secondary sm:w-32 sm:shrink-0"
              disabled={busy}
            >
              {busy ? t('wizard.opening') : t('wizard.openButton')}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            {t('wizard.folderIdHelper')}
          </p>
          <FormError message={validationError ?? undefined} />
        </FormGroup>
      </form>

      <AlertBox variant="info" className="mt-6">
        <span className="flex items-start gap-2">
          <InformationCircleIcon
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <span>{t('wizard.driveFileWarning')}</span>
        </span>
      </AlertBox>

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          data-testid="wizard-google-cancel"
          className="btn-secondary"
          disabled={busy}
          onClick={onCancel}
        >
          {t('wizard.cancel')}
        </button>
      </div>
    </div>
  )
}

function SignedInAs({ user }: { user: AuthUser }) {
  const { t } = useTranslation()
  return (
    <div
      data-testid="wizard-google-user"
      className="mt-4 flex items-center justify-center gap-3"
    >
      {user.picture === undefined ? (
        <UserCircleIcon
          className="h-10 w-10 text-text-muted"
          aria-hidden="true"
        />
      ) : (
        <img src={user.picture} alt="" className="h-10 w-10 rounded-full" />
      )}
      <div className="text-left">
        <p className="text-xs uppercase tracking-wider text-text-muted">
          {t('wizard.googleSignedInAs')}
        </p>
        <p className="text-sm font-medium text-text">{user.name}</p>
        <p className="text-xs text-text-muted">{user.email}</p>
      </div>
    </div>
  )
}
