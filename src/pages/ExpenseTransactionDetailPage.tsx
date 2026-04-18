import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkbookEntities } from '@/hooks/useWorkbookEntities'
import { useWorkbookConnection } from '@/hooks/useWorkbookConnection'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EntityDetailPage } from '@/components/EntityDetailPage'
import { EmptyState } from '@/components/EmptyState'
import { LoadingSpinner } from '@/components/LoadingSpinner'
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
import type { Client, Lot, Transaction } from '@/types/money'

function isActiveTransaction(txn: Transaction): boolean {
  return txn.archived !== 'true' && txn.deleted !== 'true'
}

function isActiveLot(l: Lot): boolean {
  return l.archived !== 'true' && l.deleted !== 'true'
}

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
    workbookError,
    onRetry,
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
      (tx) => tx.id === transactionId && isActiveTransaction(tx),
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
  const [saveError, setSaveError] = useState<string | null>(null)
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
    setSaveError(null)
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
    setSaveError(null)

    const parsedExpense = parseExpenseAmountInput(amountInput)
    if (parsedExpense == null || parsedExpense >= 0) {
      setSaveError(t('expenseTransactionDetail.amountInvalid'))
      return
    }

    const lotUpdates: { lotId: string; quantity: number; amount: number }[] = []
    for (const l of lotsLinked) {
      const q = parseLotQuantityInput(lotQuantityInputs[l.id] ?? '')
      const a = parseLotPurchaseAmountInput(lotAmountInputs[l.id] ?? '')
      if (q == null) {
        setSaveError(t('expenseTransactionDetail.lotQuantityInvalid'))
        return
      }
      if (a == null) {
        setSaveError(t('expenseTransactionDetail.lotAmountInvalid'))
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
      setSaveError(
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
      setSaveError(
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
            className="text-blue-600 hover:text-blue-800"
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
                  className="text-blue-600 hover:text-blue-800"
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
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">
            {t('expenseTransactionDetail.amountHeading')}
          </h3>
          <label className="block max-w-xs text-sm text-gray-600">
            <span className="mb-1 block">{t('expenseTransactionDetail.amountLabel')}</span>
            <input
              type="text"
              inputMode="decimal"
              data-testid="expense-detail-amount-input"
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value)
                setSaveError(null)
              }}
            />
          </label>
          {expenseFieldError ? (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {expenseFieldError}
            </p>
          ) : null}
        </section>

        {showLotSumMismatch ? (
          <div
            role="status"
            data-testid="expense-detail-lot-sum-mismatch"
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {t('expenseTransactionDetail.lotSumMismatch', {
              sumLots: sumLotsDisplay,
              absTxn: absTxnDisplay,
            })}
          </div>
        ) : null}

        {lotsLinked.length > 0 ? (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
              {t('expenseTransactionDetail.lotsTitle')}
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                      {t('expenseTransactionDetail.lotDescription')}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                      {t('expenseTransactionDetail.lotQuantity')}
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                      {t('expenseTransactionDetail.lotAmount')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {lotsLinked.map((lot) => {
                    const inv = inventoryById.get(lot.inventory_id)
                    const invLabel = inv?.name?.trim() ? inv.name : lot.inventory_id
                    const qtyVal = lotQuantityInputs[lot.id] ?? String(lot.quantity)
                    const amtVal = lotAmountInputs[lot.id] ?? String(lot.amount)
                    return (
                      <tr key={lot.id}>
                        <td className="px-4 py-3 text-sm">
                          <Link
                            to={`/inventory/${lot.inventory_id}`}
                            data-testid={`expense-detail-lot-inv-${lot.id}`}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            {invLabel}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <input
                            type="text"
                            inputMode="decimal"
                            data-testid={`expense-detail-lot-quantity-input-${lot.id}`}
                            className="ml-auto w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                            value={qtyVal}
                            onChange={(e) => {
                              setLotQuantityInputs((prev) => ({
                                ...prev,
                                [lot.id]: e.target.value,
                              }))
                              setSaveError(null)
                            }}
                          />
                          {lotQuantityFieldErrors[lot.id] ? (
                            <p className="mt-1 text-xs text-red-600" role="alert">
                              {lotQuantityFieldErrors[lot.id]}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <input
                            type="text"
                            inputMode="decimal"
                            data-testid={`expense-detail-lot-amount-input-${lot.id}`}
                            className="ml-auto w-28 rounded border border-gray-300 px-2 py-1.5 text-right text-sm"
                            value={amtVal}
                            onChange={(e) => {
                              setLotAmountInputs((prev) => ({
                                ...prev,
                                [lot.id]: e.target.value,
                              }))
                              setSaveError(null)
                            }}
                          />
                          {lotAmountFieldErrors[lot.id] ? (
                            <p className="mt-1 text-xs text-red-600" role="alert">
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
        ) : (
          <EmptyState messageKey="expenseTransactionDetail.lotsEmpty" />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            data-testid="expense-detail-save-changes"
            disabled={saveDisabled}
            onClick={() => void onSaveAll()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saveBusy ? t('expenseTransactionDetail.saving') : t('expenseTransactionDetail.saveChanges')}
          </button>
        </div>
        {saveError ? (
          <p className="text-sm text-red-600" role="alert" data-testid="expense-detail-save-error">
            {saveError}
          </p>
        ) : null}
      </div>
    ) : null

  const showNotFound =
    workbookStatus === 'ready' &&
    transactionId !== '' &&
    (transaction == null || transaction.type !== 'expense')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {spreadsheetId ? (
        <ConnectionStatus
          status={workbookStatus}
          errorMessage={workbookError}
          onRetry={onRetry}
        />
      ) : null}

      {workbookStatus === 'loading' && spreadsheetId ? (
        <div className="mt-8 flex justify-center" aria-busy="true">
          <LoadingSpinner />
        </div>
      ) : null}

      {showNotFound && (
        <div className="rounded-lg border border-gray-200 bg-white px-8 py-12 text-center shadow">
          <p className="text-gray-600">{t('expenseTransactionDetail.notFound')}</p>
          <Link
            to="/transactions"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            {t('expenseTransactionDetail.backToList')}
          </Link>
        </div>
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
