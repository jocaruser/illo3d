import { useSheetsStore } from '@/stores/sheetsStore'
import { connect } from '@/services/sheets/connection'
import { useTransactions } from '@/hooks/useTransactions'
import { useClients } from '@/hooks/useClients'
import { TransactionsTable } from '@/components/TransactionsTable'
import { BalanceDisplay } from '@/components/BalanceDisplay'
import { ConnectionStatus } from '@/components/ConnectionStatus'
import { EmptyState } from '@/components/EmptyState'
import { calculateBalance } from '@/utils/money'

export function TransactionsPage() {
  const {
    status,
    spreadsheetId,
    errorMessage,
    setConnecting,
    setConnected,
    setError,
  } = useSheetsStore()

  const { data: transactions = [], isLoading: transactionsLoading } =
    useTransactions(spreadsheetId)
  const { data: clients = [] } = useClients(spreadsheetId)

  const handleRetry = async () => {
    setConnecting()
    const result = await connect()
    if (result.ok) {
      setConnected(result.spreadsheetId)
    } else {
      setError(result.error)
    }
  }

  const balance = calculateBalance(transactions.map((t) => t.amount))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Transactions</h2>

      <ConnectionStatus
        status={status}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {status === 'connected' && (
        <>
          <div className="mb-4">
            <BalanceDisplay balance={balance} />
          </div>

          {transactionsLoading ? (
            <p className="text-gray-600">Loading...</p>
          ) : transactions.length === 0 ? (
            <EmptyState />
          ) : (
            <TransactionsTable transactions={transactions} clients={clients} />
          )}
        </>
      )}
    </div>
  )
}
