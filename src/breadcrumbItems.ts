import type { TFunction } from 'i18next'
import type { BreadcrumbItem } from '@/components/Breadcrumbs'

const MAIN_ROUTES = [
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
  '/clients': 'nav.clients',
  '/jobs': 'nav.jobs',
  '/transactions': 'nav.transactions',
  '/expenses': 'nav.expenses',
  '/inventory': 'nav.inventory',
}

const JOB_DETAIL_PATH = /^\/jobs\/([^/]+)$/

export function getBreadcrumbItems(
  pathname: string,
  t: TFunction,
): BreadcrumbItem[] | null {
  const jobDetailMatch = JOB_DETAIL_PATH.exec(pathname)
  if (jobDetailMatch) {
    const id = jobDetailMatch[1]
    return [
      { label: t('breadcrumb.home'), to: '/transactions' },
      { label: t('nav.jobs'), to: '/jobs' },
      { label: id },
    ]
  }

  if (!isMainRoute(pathname)) {
    return null
  }

  return [
    { label: t('breadcrumb.home'), to: '/transactions' },
    { label: t(routeToNavKey[pathname]) },
  ]
}
