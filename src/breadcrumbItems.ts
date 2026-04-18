import type { TFunction } from 'i18next'
import type { BreadcrumbItem } from '@/components/Breadcrumbs'

const MAIN_ROUTES = [
  '/dashboard',
  '/clients',
  '/jobs',
  '/transactions',
  '/inventory',
] as const

type MainRoute = (typeof MAIN_ROUTES)[number]

function isMainRoute(pathname: string): pathname is MainRoute {
  return (MAIN_ROUTES as readonly string[]).includes(pathname)
}

const routeToNavKey: Record<MainRoute, string> = {
  '/dashboard': 'nav.dashboard',
  '/clients': 'nav.clients',
  '/jobs': 'nav.jobs',
  '/transactions': 'nav.transactions',
  '/inventory': 'nav.inventory',
}

const JOB_DETAIL_PATH = /^\/jobs\/([^/]+)$/
const CLIENT_DETAIL_PATH = /^\/clients\/([^/]+)$/
const INVENTORY_DETAIL_PATH = /^\/inventory\/([^/]+)$/
const TRANSACTION_DETAIL_PATH = /^\/transactions\/([^/]+)$/

export type JobDescriptionResolver = (jobId: string) => string | undefined

export type ClientNameResolver = (clientId: string) => string | undefined

export type InventoryNameResolver = (inventoryId: string) => string | undefined

export type TransactionConceptResolver = (
  transactionId: string,
) => string | undefined

export function getBreadcrumbItems(
  pathname: string,
  t: TFunction,
  resolveJobDescription?: JobDescriptionResolver,
  resolveClientName?: ClientNameResolver,
  resolveInventoryName?: InventoryNameResolver,
  resolveTransactionConcept?: TransactionConceptResolver,
): BreadcrumbItem[] | null {
  const clientDetailMatch = CLIENT_DETAIL_PATH.exec(pathname)
  if (clientDetailMatch) {
    const id = clientDetailMatch[1]
    const name = resolveClientName?.(id)
    return [
      { label: t('breadcrumb.home'), to: '/dashboard' },
      { label: t('nav.clients'), to: '/clients' },
      { label: name ?? id },
    ]
  }

  const jobDetailMatch = JOB_DETAIL_PATH.exec(pathname)
  if (jobDetailMatch) {
    const id = jobDetailMatch[1]
    const description = resolveJobDescription?.(id)
    return [
      { label: t('breadcrumb.home'), to: '/dashboard' },
      { label: t('nav.jobs'), to: '/jobs' },
      { label: description ?? id },
    ]
  }

  const inventoryDetailMatch = INVENTORY_DETAIL_PATH.exec(pathname)
  if (inventoryDetailMatch) {
    const id = inventoryDetailMatch[1]
    const name = resolveInventoryName?.(id)
    return [
      { label: t('breadcrumb.home'), to: '/dashboard' },
      { label: t('nav.inventory'), to: '/inventory' },
      { label: name ?? id },
    ]
  }

  const transactionDetailMatch = TRANSACTION_DETAIL_PATH.exec(pathname)
  if (transactionDetailMatch) {
    const id = transactionDetailMatch[1]
    const concept = resolveTransactionConcept?.(id)?.trim()
    return [
      { label: t('breadcrumb.home'), to: '/dashboard' },
      { label: t('nav.transactions'), to: '/transactions' },
      { label: concept && concept.length > 0 ? concept : id },
    ]
  }

  if (!isMainRoute(pathname)) {
    return null
  }

  return [
    { label: t('breadcrumb.home'), to: '/dashboard' },
    { label: t(routeToNavKey[pathname]) },
  ]
}
