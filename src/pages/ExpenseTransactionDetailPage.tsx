import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { NotFoundCard } from '@/components/NotFoundCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { FormGroup, FormLabel, FormInput, FormError } from '@/components/Form'
import { AlertBox } from '@/components/AlertBox'
import {
  buildExpenseLotLinkMaps,
  getTransactionConceptLink,
} from '@/lib/money/transactionConceptLink'
import { isExpenseLotSumMismatch } from '@/lib/money/expenseLotAmountMismatch'
import {
  parseLotPurchaseAmountInput,
  parseLotQuantityInput,
  updateLotFields,
} from '@/services/lots/updateLotAmount'
import {
  parseExpenseAmountInput,
  updateTransactionAmount,
} from '@/services/transactions/updateTransactionAmount'
import type { Client } from '@/types/money'
import { toast } from '@/lib/toast'
import { isActiveRow, isActiveLot } from '@/lib/entityFilters'

function getClientName(clients: Client[], clientId?: string): string {
  if (!clientId) return ''
  const client = clients.find((c) => c.id === clientId)
  return client?.name ?? ''
}

export function ExpenseTransactionDetailPage() {
  const { t } = useTranslation()
  const { transactionId = '' } = useParams<{ transactionId: string }>()
  const {
    spreadsheetId,
    workbookStatus,
  } = useWorkbookConnection()

  const { transactions: allTransactions, lots: allLots, clients, inventory } =
    useWorkbookEntities()

  const { expenseTxnIdsWithLots } = useMemo(
    () => buildExpenseLotLinkMaps(allLots),
    [allLots],
  )

  const transaction = useMemo(() => {
    if (!transactionId) return undefined
    return allTransactions.find(
      (tx) => tx.id === transactionId && isActiveRow(tx),
    )
  }, [allTransactions, transactionId])

  const isRenderableExpense =
    transaction != null && transaction.type === 'expense'

  const lotsLinked = useMemo(() => {
    if (!transactionId) return []
    return allLots
      .filter((l) => l.transaction_id === transactionId && isActiveLot(l))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [allLots, transactionId])

  const inventoryById = useMemo(() => {
    const m = new Map<string, (typeof inventory)[number]>()
    for (const inv of inventory) {
      if (inv.archived !== 'true' && inv.deleted !== 'true') {
        m.set(inv.id, inv)
      }
    }
    return m
  }, [inventory])

  const [amountInput, setAmountInput] = useState('')
  const [lotAmountInputs, setLotAmountInputs] = useState<Record<string, string>>({})
  const [lotQuantityInputs, setLotQuantityInputs] = useState<Record<string, string>>({})
  const [saveBusy, setSaveBusy] = useState(false)

  const lotsSignature = useMemo(
    () => lotsLinked.map((l) => `${l.id}\0${l.amount}\0${l.quantity}`).join('\n'),
    [lotsLinked],
  )

  useEffect(() => {
    if (!transaction) return
    setAmountInput(String(transaction.amount))
  }, [transaction])

  useEffect(() => {
    setLotAmountInputs(
      Object.fromEntries(lotsLinked.map((l) => [l.id, String(l.amount)])),
    )
    setLotQuantityInputs(
      Object.fromEntries(lotsLinked.map((l) => [l.id, String(l.quantity)])),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when `lotsSignature` (server lot data) changes; avoid `lotsLinked` identity churn wiping drafts
  }, [lotsSignature])

  const expenseFieldError = useMemo(() => {
    const trimmed = amountInput.trim()
    if (trimmed === '') return null
    const p = parseExpenseAmountInput(amountInput)
    if (p == null || p >= 0) return t('expenseTransactionDetail.amountInvalid')
    return null
  }, [amountInput, t])

  const lotQuantityFieldErrors = useMemo(() => {
    const m: Record<string, string | undefined> = {}
    for (const l of lotsLinked) {
      const raw = (lotQuantityInputs[l.id] ?? '').trim()
      if (raw === '') continue
      if (parseLotQuantityInput(lotQuantityInputs[l.id] ?? '') == null) {
        m[l.id] = t('expenseTransactionDetail.lotQuantityInvalid')
      }
    }
    return m
  }, [lotsLinked, lotQuantityInputs, t])

  const lotAmountFieldErrors = useMemo(() => {
    const m: Record<string, string | undefined> = {}
    for (const l of lotsLinked) {
      const raw = (lotAmountInputs[l.id] ?? '').trim()
      if (raw === '') continue
      if (parseLotPurchaseAmountInput(lotAmountInputs[l.id] ?? '') == null) {
        m[l.id] = t('expenseTransactionDetail.lotAmountInvalid')
      }
    }
    return m
  }, [lotsLinked, lotAmountInputs, t])

  const parsedExpenseForTotals = useMemo(() => {
    const p = parseExpenseAmountInput(amountInput)
    if (p == null || p >= 0) return null
    return p
  }, [amountInput])

  const parsedLotAmounts = useMemo(
    () =>
      lotsLinked.map((l) =>
        parseLotPurchaseAmountInput(lotAmountInputs[l.id] ?? ''),
      ),
    [lotsLinked, lotAmountInputs],
  )

  const allLotAmountsParseForTotals =
    lotsLinked.length === 0 || parsedLotAmounts.every((n) => n != null)

  const showLotSumMismatch = useMemo(() => {
    if (!isRenderableExpense) return false
    if (parsedExpenseForTotals == null) return false
    if (lotsLinked.length === 0) return false
    if (!allLotAmountsParseForTotals) return false
    return isExpenseLotSumMismatch(
      parsedLotAmounts as number[],
      parsedExpenseForTotals,
    )
  }, [
    isRenderableExpense,
    parsedExpenseForTotals,
    lotsLinked.length,
    allLotAmountsParseForTotals,
    parsedLotAmounts,
  ])

  const hasAnyFieldParseError =
    expenseFieldError != null ||
    Object.keys(lotQuantityFieldErrors).length > 0 ||
    Object.keys(lotAmountFieldErrors).length > 0

  const sumLotsDisplay = useMemo(() => {
    if (!allLotAmountsParseForTotals || lotsLinked.length === 0) return '0.00'
    return Math.abs(
      (parsedLotAmounts as number[]).reduce((s, a) => s + a, 0),
    ).toFixed(2)
  }, [allLotAmountsParseForTotals, lotsLinked.length, parsedLotAmounts])

  const absTxnDisplay = useMemo(() => {
    if (parsedExpenseForTotals == null) return '0.00'
    return Math.abs(parsedExpenseForTotals).toFixed(2)
  }, [parsedExpenseForTotals])

  const saveDisabled =
    saveBusy ||
    hasAnyFieldParseError ||
    (lotsLinked.length > 0 && showLotSumMismatch)

  const onSaveAll = async () => {
    if (!spreadsheetId || !transaction || !isRenderableExpense) return

    const parsedExpense = parseExpenseAmountInput(amountInput)
    if (parsedExpense == null || parsedExpense >= 0) {
      toast.error(t('expenseTransactionDetail.amountInvalid'))
      return
    }

    const lotUpdates: { lotId: string; quantity: number; amount: number }[] = []
    for (const l of lotsLinked) {
      const q = parseLotQuantityInput(lotQuantityInputs[l.id] ?? '')
      const a = parseLotPurchaseAmountInput(lotAmountInputs[l.id] ?? '')
      if (q == null) {
        toast.error(t('expenseTransactionDetail.lotQuantityInvalid'))
        return
      }
      if (a == null) {
        toast.error(t('expenseTransactionDetail.lotAmountInvalid'))
        return
      }
      lotUpdates.push({ lotId: l.id, quantity: q, amount: a })
    }

    if (
      lotUpdates.length > 0 &&
      isExpenseLotSumMismatch(
        lotUpdates.map((u) => u.amount),
        parsedExpense,
      )
    ) {
      toast.error(
        t('expenseTransactionDetail.lotSumMismatchSaveBlocked', {
          sumLots: sumLotsDisplay,
          absTxn: absTxnDisplay,
        }),
      )
      return
    }

    setSaveBusy(true)
    try {
      await updateTransactionAmount(spreadsheetId, transaction.id, parsedExpense)
      for (const u of lotUpdates) {
        await updateLotFields(spreadsheetId, u.lotId, {
          quantity: u.quantity,
          amount: u.amount,
        })
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('expenseTransactionDetail.saveError'),
      )
    } finally {
      setSaveBusy(false)
    }
  }

  const conceptNode =
    transaction != null ? (
      (() => {
        const link = getTransactionConceptLink(transaction, expenseTxnIdsWithLots)
        const text = transaction.concept
        if (!link) return text
        return (
          <Link
            to={link.to}
            data-testid={link.testId}
            className="text-primary hover:text-blue-800 dark:text-blue-200"
          >
            {text}
          </Link>
        )
      })()
    ) : null

  const detailFields =
    isRenderableExpense && transaction
      ? [
          { label: t('jobs.colId'), value: transaction.id },
          { label: t('transactions.date'), value: transaction.date },
          {
            label: t('transactions.type'),
            value: t(`transactions.type.${transaction.type}`),
          },
          { label: t('transactions.category'), value: transaction.category },
          { label: t('transactions.concept'), value: conceptNode },
          {
            label: t('transactions.client'),
            value:
              transaction.client_id != null && transaction.client_id !== '' ? (
                <Link
                  to={`/clients/${transaction.client_id}`}
                  className="text-primary hover:text-blue-800 dark:text-blue-200"
                >
                  {getClientName(clients, transaction.client_id) ||
                    transaction.client_id}
                </Link>
              ) : (
                '—'
              ),
          },
        ]
      : []

  const pageTitle =
    isRenderableExpense && transaction
      ? transaction.concept.trim() || transaction.id
      : transactionId

  const editableSection =
    isRenderableExpense && transaction ? (
      <div className="space-y-8">
        <section className="rounded-lg border border-border bg-surface-elevated p-6 shadow">
          <h3 className="mb-3 text-lg font-semibold text-text">
            {t('expenseTransactionDetail.amountHeading')}
          </h3>
          <FormGroup className="max-w-xs">
            <FormLabel>{t('expenseTransactionDetail.amountLabel')}</FormLabel>
            <FormInput
              type="text"
              inputMode="decimal"
              data-testid="expense-detail-amount-input"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value)
              }}
            />
            {expenseFieldError ? (
              <FormError>{expenseFieldError}</FormError>
            ) : null}
          </FormGroup>
        </section>

        {showLotSumMismatch ? (
          <AlertBox variant="warning" title={t('expenseTransactionDetail.lotSumMismatchTitle')} data-testid="expense-detail-lot-sum-mismatch">
            {t('expenseTransactionDetail.lotSumMismatch', {
              sumLots: sumLotsDisplay,
              absTxn: absTxnDisplay,
            })}
          </AlertBox>
        ) : null}

        <section>
          <h3 className="mb-3 text-lg font-semibold text-text">
            {t('expenseTransactionDetail.lotsTitle')}
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface-elevated shadow">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                    {t('jobs.colId')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-text-muted/60">
                    {t('expenseTransactionDetail.lotDescription')}
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-text-muted/60">
                    {t('expenseTransactionDetail.lotQuantity')}
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-text-muted/60">
                    {t('expenseTransactionDetail.lotAmount')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface-elevated">
                {lotsLinked.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-text-muted"
                    >
                      {t('expenseTransactionDetail.lotsEmpty')}
                    </td>
                  </tr>
                ) : null}
                {lotsLinked.map((lot, index) => {
                  const inv = inventoryById.get(lot.inventory_id)
                  const invLabel = inv?.name?.trim() ? inv.name : lot.inventory_id
                  const qtyVal = lotQuantityInputs[lot.id] ?? String(lot.quantity)
                  const amtVal = lotAmountInputs[lot.id] ?? String(lot.amount)
                  return (
                    <tr key={lot.id} className={index % 2 === 0 ? 'bg-surface-elevated' : 'bg-surface-alt'}>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-text">
                        <Link
                          to={`/inventory/${lot.inventory_id}`}
                          data-testid={`expense-detail-lot-inv-${lot.id}`}
                          className="font-medium text-primary hover:text-blue-800 dark:text-blue-200"
                        >
                          {lot.inventory_id}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {invLabel}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <FormInput
                          type="text"
                          inputMode="decimal"
                          data-testid={`expense-detail-lot-quantity-input-${lot.id}`}
                          className="ml-auto w-28 text-right"
                          value={qtyVal}
                          onChange={(e) => {
                            setLotQuantityInputs((prev) => ({
                              ...prev,
                              [lot.id]: e.target.value,
                            }))
                          }}
                        />
                        {lotQuantityFieldErrors[lot.id] ? (
                          <p className="mt-1 text-xs text-danger" role="alert">
                            {lotQuantityFieldErrors[lot.id]}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right align-top">
                        <FormInput
                          type="text"
                          inputMode="decimal"
                          data-testid={`expense-detail-lot-amount-input-${lot.id}`}
                          className="ml-auto w-28 text-right"
                          value={amtVal}
                          onChange={(e) => {
                            setLotAmountInputs((prev) => ({
                              ...prev,
                              [lot.id]: e.target.value,
                            }))
                          }}
                        />
                        {lotAmountFieldErrors[lot.id] ? (
                          <p className="mt-1 text-xs text-danger" role="alert">
                            {lotAmountFieldErrors[lot.id]}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            data-testid="expense-detail-save-changes"
            disabled={saveDisabled}
            onClick={() => void onSaveAll()}
            className="btn-primary disabled:opacity-50"
          >
            {saveBusy ? t('expenseTransactionDetail.saving') : t('expenseTransactionDetail.saveChanges')}
          </button>
        </div>
      </div>
    ) : null

  const showNotFound =
    workbookStatus === 'ready' &&
    transactionId !== '' &&
    (transaction == null || transaction.type !== 'expense')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">

      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {showNotFound && (
        <NotFoundCard
          message={t('expenseTransactionDetail.notFound')}
          backTo="/transactions"
          backLabel={t('expenseTransactionDetail.backToList')}
        />
      )}

      {workbookStatus === 'ready' && isRenderableExpense && transaction && (
        <EntityDetailPage
          backTo="/transactions"
          backLabel={t('expenseTransactionDetail.backToList')}
          title={pageTitle}
          fields={detailFields}
          editLabel=""
          deleteLabel=""
          onEdit={() => {}}
          onDelete={() => {}}
          hidePrimaryActions
        >
          {editableSection}
        </EntityDetailPage>
      )}
    </div>
  )
}
