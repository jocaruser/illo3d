import type { EntityManager } from '@/Repository/EntityManager'
import type { AuditParent } from './AuditLogger'

type LifecycleFlag = 'archived' | 'deleted'

/**
 * Archive / soft-delete / restore with cascades. Cascade tree:
 *   client    → its crm_notes + tag_links + jobs (each job cascades further)
 *   job       → its pieces (→ piece_items) + crm_notes + tag_links
 *   inventory → its active lots
 * Restores never cascade — children are restored individually.
 * Every cascaded write carries the immediate parent for the audit trail.
 */
export class LifecycleService {
  constructor(private readonly em: EntityManager) {}

  archiveClient(clientId: string): void {
    this.setClientFlag(clientId, 'archived')
  }

  softDeleteClient(clientId: string): void {
    this.setClientFlag(clientId, 'deleted')
  }

  archiveJob(jobId: string, parent?: AuditParent): void {
    this.setJobFlag(jobId, 'archived', parent)
  }

  softDeleteJob(jobId: string, parent?: AuditParent): void {
    this.setJobFlag(jobId, 'deleted', parent)
  }

  archiveInventory(inventoryId: string): void {
    this.setInventoryFlag(inventoryId, 'archived')
  }

  softDeleteInventory(inventoryId: string): void {
    this.setInventoryFlag(inventoryId, 'deleted')
  }

  restoreClient(clientId: string): void {
    const client = this.em.clients.find(clientId)
    if (!client) return
    client.archived = ''
    client.deleted = ''
    this.em.clients.save(client)
  }

  restoreJob(jobId: string): void {
    const job = this.em.jobs.find(jobId)
    if (!job) return
    job.archived = ''
    job.deleted = ''
    this.em.jobs.save(job)
  }

  restorePiece(pieceId: string): void {
    const piece = this.em.pieces.find(pieceId)
    if (!piece) return
    piece.archived = ''
    piece.deleted = ''
    this.em.pieces.save(piece)
  }

  restoreInventory(inventoryId: string): void {
    const item = this.em.inventory.find(inventoryId)
    if (!item) return
    item.archived = ''
    item.deleted = ''
    this.em.inventory.save(item)
  }

  private setClientFlag(clientId: string, flag: LifecycleFlag): void {
    const client = this.em.clients.find(clientId)
    if (!client || client[flag].toLowerCase() === 'true') return
    client[flag] = 'true'
    this.em.clients.save(client)
    const parent: AuditParent = { entityName: 'client', entityId: clientId }
    this.cascadeNotesAndTags('client', clientId, flag, parent)
    for (const job of this.em.jobs.findByClient(clientId)) {
      this.setJobFlag(job.id, flag, parent)
    }
  }

  private setJobFlag(
    jobId: string,
    flag: LifecycleFlag,
    parent?: AuditParent
  ): void {
    const job = this.em.jobs.find(jobId)
    if (!job || job[flag].toLowerCase() === 'true') return
    job[flag] = 'true'
    this.em.jobs.save(job, parent)
    const jobParent: AuditParent = { entityName: 'job', entityId: jobId }
    for (const piece of this.em.pieces.findByJob(jobId)) {
      if (piece[flag].toLowerCase() === 'true') continue
      piece[flag] = 'true'
      this.em.pieces.save(piece, jobParent)
      const pieceParent: AuditParent = {
        entityName: 'piece',
        entityId: piece.id,
      }
      for (const item of this.em.pieceItems.findByPiece(piece.id)) {
        if (item[flag].toLowerCase() === 'true') continue
        item[flag] = 'true'
        this.em.pieceItems.save(item, pieceParent)
      }
    }
    this.cascadeNotesAndTags('job', jobId, flag, jobParent)
  }

  private setInventoryFlag(inventoryId: string, flag: LifecycleFlag): void {
    const item = this.em.inventory.find(inventoryId)
    if (!item || item[flag].toLowerCase() === 'true') return
    item[flag] = 'true'
    this.em.inventory.save(item)
    const parent: AuditParent = {
      entityName: 'inventory',
      entityId: inventoryId,
    }
    for (const lot of this.em.lots.findActiveByInventory(inventoryId)) {
      lot[flag] = 'true'
      this.em.lots.save(lot, parent)
    }
  }

  private cascadeNotesAndTags(
    entityType: 'client' | 'job',
    entityId: string,
    flag: LifecycleFlag,
    parent: AuditParent
  ): void {
    for (const note of this.em.crmNotes.findByEntity(entityType, entityId)) {
      if (note[flag].toLowerCase() === 'true') continue
      note[flag] = 'true'
      this.em.crmNotes.save(note, parent)
    }
    for (const link of this.em.tagLinks.findActiveByEntity(
      entityType,
      entityId
    )) {
      link[flag] = 'true'
      this.em.tagLinks.save(link, parent)
    }
  }
}
