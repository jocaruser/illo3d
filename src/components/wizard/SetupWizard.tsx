import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChooseActionStep } from './ChooseActionStep'
import { useCreateShop } from '@/hooks/useCreateShop'
import { useOpenExistingShop } from '@/hooks/useOpenExistingShop'
import { CreateShopStep } from './CreateShopStep'
import { SuccessStep } from './SuccessStep'
import { OpenExistingStep } from './OpenExistingStep'
import { useBackendStore } from '@/stores/backendStore'
import type { Backend } from '@/stores/backendStore'

export type WizardStep =
  | 'choose'
  | 'create'
  | 'open-existing'
  | 'success'

interface SetupWizardProps {
  onCancel: () => void
  onCreateComplete: (folderName: string) => void
  onOpenComplete: () => void
}

export function SetupWizard({
  onCancel,
  onCreateComplete,
  onOpenComplete,
}: SetupWizardProps) {
  const { t } = useTranslation()
  const backendFromStore = useBackendStore((s) => s.backend)
  const setBackend = useBackendStore((s) => s.setBackend)
  const { createShop } = useCreateShop()
  const { selectFolder, validateAndSetShop, selectLocalFolder } = useOpenExistingShop()
  const [step, setStep] = useState<WizardStep>('choose')
  const [selectedBackend, setSelectedBackend] = useState<Backend | null>(null)
  const [createdFolderName, setCreatedFolderName] = useState('')

  const handleSelectBackend = (backend: Backend) => {
    setSelectedBackend(backend)
    setBackend(backend)
  }

  const effectiveBackend = selectedBackend ?? backendFromStore

  const handleChooseCreate = () => {
    if (effectiveBackend) {
      setBackend(effectiveBackend)
      setStep('create')
    }
  }

  const handleChooseOpen = () => {
    if (effectiveBackend) {
      setBackend(effectiveBackend)
      setStep('open-existing')
    }
  }

  const handleCreateSuccess = (folderName: string) => {
    setCreatedFolderName(folderName)
    setStep('success')
  }

  const handleSuccessDismiss = () => {
    setStep('choose')
    setSelectedBackend(null)
    onCreateComplete(createdFolderName)
  }

  const handleOpenSuccess = () => {
    setStep('choose')
    setSelectedBackend(null)
    onOpenComplete()
  }

  const renderStep = () => {
    switch (step) {
      case 'choose':
        return (
          <ChooseActionStep
            selectedBackend={effectiveBackend}
            onSelectBackend={handleSelectBackend}
            onCreateNew={handleChooseCreate}
            onOpenExisting={handleChooseOpen}
            onCancel={onCancel}
          />
        )
      case 'create':
        return (
          <CreateShopStep
            backend={effectiveBackend}
            onBack={() => setStep('choose')}
            onSuccess={handleCreateSuccess}
            onCreateShop={createShop}
          />
        )
      case 'open-existing':
        return (
          <OpenExistingStep
            backend={effectiveBackend}
            onBack={() => setStep('choose')}
            onSuccess={handleOpenSuccess}
            onSelectFolder={selectFolder}
            onSelectLocalFolder={selectLocalFolder}
            onValidateFolder={validateAndSetShop}
          />
        )
      case 'success':
        return (
          <SuccessStep
            folderName={createdFolderName}
            onContinue={handleSuccessDismiss}
            onClose={handleSuccessDismiss}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
      >
        <h2 id="wizard-title" className="sr-only">
          {t('wizard.title')}
        </h2>
        {renderStep()}
      </div>
    </div>
  )
}
