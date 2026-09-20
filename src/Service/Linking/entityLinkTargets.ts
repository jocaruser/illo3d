import type { AuditEntityName } from '@/Entity/AuditEntry'
import type { EntityManager } from '@/Repository/EntityManager'

export type WorkbookEntityKind =
  | 'client'
  | 'job'
  | 'piece'
  | 'inventory'
  | 'transaction'

export interface EntityNavigationRequest {
  kind: WorkbookEntityKind
  id: string
}

function linkableClient(em: EntityManager, id: string): string | null {
  const client = em.clients.find(id)
  if (client === null || client.isDeleted()) return null
  return `/clients/${id}`
}

function linkableJob(em: EntityManager, id: string): string | null {
  const job = em.jobs.find(id)
  if (job === null || job.isDeleted()) return null
  return `/jobs/${id}`
}

function linkableInventory(em: EntityManager, id: string): string | null {
  const item = em.inventory.find(id)
  if (item === null || item.isDeleted()) return null
  return `/inventory/${id}`
}

/** Piece deep link when the piece and its job still exist and are not deleted. */
export function jobPathForPiece(em: EntityManager, pieceId: string): string | null {
  const piece = em.pieces.find(pieceId)
  if (piece === null || piece.isDeleted()) return null
  const jobId = piece.jobId
  if (jobId === '') return null
  const job = em.jobs.find(jobId)
  if (job === null || job.isDeleted()) return null
  return `/jobs/${jobId}#piece-${pieceId}`
}

/** Transaction rows: income with a job ref, or expense purchases with stock lots. */
export function transactionNavigationTarget(
  em: EntityManager,
  transactionId: string
): string | null {
  const transaction = em.transactions.find(transactionId)
  if (transaction === null || transaction.isDeleted()) return null
  if (
    transaction.isIncome() &&
    transaction.refType === 'job' &&
    transaction.refId.trim() !== ''
  ) {
    return linkableJob(em, transaction.refId)
  }
  if (
    transaction.isExpense() &&
    em.lots.findActiveByTransaction(transaction.id).length > 0
  ) {
    return `/transactions/${transactionId}`
  }
  return null
}

export function resolveEntityNavigationTarget(
  em: EntityManager,
  request: EntityNavigationRequest
): string | null {
  switch (request.kind) {
    case 'client':
      return linkableClient(em, request.id)
    case 'job':
      return linkableJob(em, request.id)
    case 'piece':
      return jobPathForPiece(em, request.id)
    case 'inventory':
      return linkableInventory(em, request.id)
    case 'transaction':
      return transactionNavigationTarget(em, request.id)
    default:
      return null
  }
}

export function mentionTokenTarget(
  em: EntityManager,
  kind: 'CL' | 'J' | 'P',
  id: string
): string | null {
  if (kind === 'CL') return linkableClient(em, id)
  if (kind === 'J') return linkableJob(em, id)
  return jobPathForPiece(em, id)
}

export function auditEntityNavigationTarget(
  em: EntityManager,
  entityName: AuditEntityName | '',
  entityId: string
): string | null {
  if (entityId === '') return null
  switch (entityName) {
    case 'client':
      return linkableClient(em, entityId)
    case 'job':
      return linkableJob(em, entityId)
    case 'piece':
      return jobPathForPiece(em, entityId)
    case 'inventory':
      return linkableInventory(em, entityId)
    case 'transaction':
      return transactionNavigationTarget(em, entityId)
    default:
      return null
  }
}
