import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isCsvBackendEnabled } from '@/config/csvBackend'
import { useCreateShop } from '@/hooks/useCreateShop'
import { useOpenExistingShop } from '@/hooks/useOpenExistingShop'
import { ChooseActionStep } from './ChooseActionStep'
import { CreateShopStep } from './CreateShopStep'
import { SuccessStep } from './SuccessStep'
import { OpenExistingStep } from './OpenExistingStep'

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
  const { createShop } = useCreateShop()
  const { selectFolder, validateAndSetShop } = useOpenExistingShop()
  const [step, setStep] = useState<WizardStep>('choose')
  const [createdFolderName, setCreatedFolderName] = useState('')

  const handleChooseCreate = () => setStep('create')
  const handleChooseOpen = () => setStep('open-existing')
  const handleCreateSuccess = (folderName: string) => {
    setCreatedFolderName(folderName)
    setStep('success')
  }
  const handleSuccessDismiss = () => {
    setStep('choose')
    onCreateComplete(createdFolderName)
  }
  const handleOpenSuccess = () => {
    setStep('choose')
    onOpenComplete()
  }

  const renderStep = () => {
    switch (step) {
      case 'choose':
        return (
          <ChooseActionStep
            onCreateNew={handleChooseCreate}
            onOpenExisting={handleChooseOpen}
            onCancel={onCancel}
            showCreateNew={!isCsvBackendEnabled()}
          />
        )
      case 'create':
        return (
          <CreateShopStep
            onBack={() => setStep('choose')}
            onSuccess={handleCreateSuccess}
            onCreateShop={createShop}
          />
        )
      case 'open-existing':
        return (
          <OpenExistingStep
            onBack={() => setStep('choose')}
            onSuccess={handleOpenSuccess}
            onSelectFolder={selectFolder}
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
