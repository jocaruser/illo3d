import type { TFunction } from 'i18next'
import type { BreadcrumbItem } from '@/components/Breadcrumbs'

const MAIN_ROUTES = [
  '/dashboard',
  '/clients',
  '/jobs',
  '/transactions',
  '/expenses',
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
  '/expenses': 'nav.expenses',
  '/inventory': 'nav.inventory',
}

const JOB_DETAIL_PATH = /^\/jobs\/([^/]+)$/
const CLIENT_DETAIL_PATH = /^\/clients\/([^/]+)$/

export type JobDescriptionResolver = (jobId: string) => string | undefined

export type ClientNameResolver = (clientId: string) => string | undefined

export function getBreadcrumbItems(
  pathname: string,
  t: TFunction,
  resolveJobDescription?: JobDescriptionResolver,
  resolveClientName?: ClientNameResolver,
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

  if (!isMainRoute(pathname)) {
    return null
  }

  return [
    { label: t('breadcrumb.home'), to: '/dashboard' },
    { label: t(routeToNavKey[pathname]) },
  ]
}
