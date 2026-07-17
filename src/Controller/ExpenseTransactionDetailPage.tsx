import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AlertBox } from '@/Component/AlertBox'
import { NotFoundCard } from '@/Component/NotFoundCard'
import { toast } from '@/Component/Toast'
import { EntityDetailPage } from '@/Component/detail/EntityDetailPage'
import {
  ExpenseLotsTable,
  type ExpenseLotDraft,
  type ExpenseLotRow,
} from '@/Component/detail/ExpenseLotsTable'
import { FormError } from '@/Component/form/FormError'
import { FormGroup } from '@/Component/form/FormGroup'
import { FormInput } from '@/Component/form/FormInput'
import { FormLabel } from '@/Component/form/FormLabel'
import { SectionHeading } from '@/Component/layout/SectionHeading'
import type { Lot } from '@/Entity/Lot'
import { parseNumericCell } from '@/Entity/SheetEntity'
import type { Transaction } from '@/Entity/Transaction'
import { useEntityManager } from '@/Hook/useEntityManager'
import type { EntityManager } from '@/Repository/EntityManager'
import { InventoryService } from '@/Service/InventoryService'

const BACK_TO = '/transactions'

/** Rounding slack: lot amounts are money, so anything under a cent is agreement. */
const SUM_TOLERANCE = 0.01

export function ExpenseTransactionDetailPage() {
  const { t } = useTranslation()
  const { transactionId = '' } = useParams<{ transactionId: string }>()
  const em = useEntityManager()
  const transaction = em.transactions.find(transactionId)

  // Income is generated from a paid job and has nothing to edit here.
  if (transaction === null || !transaction.isExpense()) {
    return (
      <NotFoundCard
        message={t('expenseTransactionDetail.notFound')}
        backTo={BACK_TO}
        backLabel={t('expenseTransactionDetail.backToList')}
      />
    )
  }
  return <ExpenseDetail transaction={transaction} />
}

interface ExpenseDetailProps {
  transaction: Transaction
}

function initialDrafts(lots: Lot[]): Record<string, ExpenseLotDraft> {
  return Object.fromEntries(
    lots.map((lot) => [
      lot.id,
      {
        quantity: String(lot.quantity ?? ''),
        amount: String(lot.amount ?? ''),
      },
    ])
  )
}

function ExpenseDetail({ transaction }: ExpenseDetailProps) {
  const { t } = useTranslation()
  const em = useEntityManager()

  const lots = useMemo(
    () => em.lots.findActiveByTransaction(transaction.id),
    [em, transaction.id]
  )

  const [amount, setAmount] = useState(String(transaction.amount ?? ''))
  const [drafts, setDrafts] = useState<Record<string, ExpenseLotDraft>>(() =>
    initialDrafts(lots)
  )
  const [saveError, setSaveError] = useState('')

  const parsedAmount = parseNumericCell(amount)
  const amountError =
    parsedAmount === undefined || parsedAmount >= 0
      ? t('expenseTransactionDetail.amountInvalid')
      : ''

  const rows = useMemo<ExpenseLotRow[]>(
    () =>
      lots.map((lot) => {
        const draft = drafts[lot.id]
        const quantity = parseNumericCell(draft.quantity)
        const lotAmount = parseNumericCell(draft.amount)
        return {
          lot,
          materialName: em.inventory.find(lot.inventoryId)?.name ?? '',
          draft,
          quantityError:
            quantity === undefined || quantity <= 0
              ? t('expenseTransactionDetail.lotQuantityInvalid')
              : '',
          amountError:
            lotAmount === undefined || lotAmount < 0
              ? t('expenseTransactionDetail.lotAmountInvalid')
              : '',
        }
      }),
    [em, lots, drafts, t]
  )

  /**
   * A lot-backed expense must equal what its lots cost, or the books disagree
   * with the shelf. Only meaningful once every figure involved parses.
   */
  const mismatch = useMemo(() => {
    if (lots.length === 0 || parsedAmount === undefined) return null
    let sumLots = 0
    for (const lot of lots) {
      const lotAmount = parseNumericCell(drafts[lot.id].amount)
      if (lotAmount === undefined) return null
      sumLots += Math.abs(lotAmount)
    }
    const absTxn = Math.abs(parsedAmount)
    // Round to cents first: 30 - 29.99 is 0.010000000000001705 in binary float,
    // which would flag an exactly-one-cent gap the tolerance is meant to allow.
    const difference = Math.round(Math.abs(sumLots - absTxn) * 100) / 100
    if (difference <= SUM_TOLERANCE) return null
    return { sumLots: sumLots.toFixed(2), absTxn: absTxn.toFixed(2) }
  }, [lots, drafts, parsedAmount])

  const handleChange = (lotId: string, patch: Partial<ExpenseLotDraft>) =>
    setDrafts((current) => ({
      ...current,
      [lotId]: { ...current[lotId], ...patch },
    }))

  const handleSave = () => {
    const service = new InventoryService(em)
    const amountResult = service.updateTransactionAmount(
      transaction.id,
      parsedAmount ?? NaN
    )
    if (!amountResult.ok) {
      setSaveError(t(amountResult.error))
      return
    }
    for (const lot of lots) {
      const draft = drafts[lot.id]
      const lotResult = service.updateLot(lot.id, {
        quantity: parseNumericCell(draft.quantity) ?? NaN,
        amount: parseNumericCell(draft.amount) ?? NaN,
      })
      if (!lotResult.ok) {
        setSaveError(t(lotResult.error))
        return
      }
    }
    setSaveError('')
    toast.success(t('toast.changeApplied'))
  }

  const conceptValue = conceptField(em, transaction)
  const client =
    transaction.clientId === '' ? null : em.clients.find(transaction.clientId)

  return (
    <EntityDetailPage
      backTo={BACK_TO}
      backLabel={t('expenseTransactionDetail.backToList')}
      title={transaction.concept}
      fields={[
        { label: t('transactions.colId'), value: transaction.id },
        { label: t('transactions.date'), value: transaction.date },
        {
          label: t('transactions.type'),
          value: t(`transactions.type.${transaction.type}`),
        },
        { label: t('transactions.category'), value: transaction.category },
        { label: t('transactions.concept'), value: conceptValue },
        {
          label: t('transactions.client'),
          value:
            client === null ? (
              ''
            ) : (
              <Link
                to={`/clients/${client.id}`}
                className="text-primary hover:underline"
              >
                {client.name}
              </Link>
            ),
        },
      ]}
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <SectionHeading>
            {t('expenseTransactionDetail.amountHeading')}
          </SectionHeading>
          <FormGroup className="w-56">
            <FormLabel htmlFor="expense-amount">
              {t('expenseTransactionDetail.amountLabel')}
            </FormLabel>
            <FormInput
              id="expense-amount"
              data-testid="expense-detail-amount-input"
              type="number"
              step=".01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <FormError message={amountError} />
          </FormGroup>
        </section>

        <ExpenseLotsTable rows={rows} onChange={handleChange} />

        {mismatch !== null && (
          <AlertBox variant="warning">
            <span data-testid="expense-detail-lot-sum-mismatch">
              {t('expenseTransactionDetail.lotSumMismatch', mismatch)}
            </span>
          </AlertBox>
        )}

        <div className="space-y-2">
          <button
            type="button"
            data-testid="expense-detail-save-changes"
            className="btn-primary"
            disabled={mismatch !== null}
            onClick={handleSave}
          >
            {t('expenseTransactionDetail.saveChanges')}
          </button>
          <FormError message={saveError} />
        </div>
      </div>
    </EntityDetailPage>
  )
}

/** Same link rules as the transactions list. */
function conceptField(em: EntityManager, transaction: Transaction): ReactNode {
  if (transaction.refType === 'job') {
    return (
      <Link
        to={`/jobs/${transaction.refId}`}
        className="text-primary hover:underline"
      >
        {transaction.concept}
      </Link>
    )
  }
  if (em.lots.findActiveByTransaction(transaction.id).length > 0) {
    return (
      <Link
        to={`/transactions/${transaction.id}`}
        className="text-primary hover:underline"
      >
        {transaction.concept}
      </Link>
    )
  }
  return transaction.concept
}
