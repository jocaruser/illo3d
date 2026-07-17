import { AuditLogger } from '@/Service/AuditLogger'
import { SystemClock, type Clock } from '@/Service/Clock'
import { useAuthStore } from '@/Store/authStore'
import { workbookTabAccess, type TabAccess } from '@/Store/TabAccess'
import { AuditLogRepository } from './AuditLogRepository'
import { ClientRepository } from './ClientRepository'
import { CrmNoteRepository } from './CrmNoteRepository'
import { InventoryRepository } from './InventoryRepository'
import { JobRepository } from './JobRepository'
import { LotRepository } from './LotRepository'
import { PieceItemRepository } from './PieceItemRepository'
import { PieceRepository } from './PieceRepository'
import { TagLinkRepository } from './TagLinkRepository'
import { TagRepository } from './TagRepository'
import { TransactionRepository } from './TransactionRepository'

/**
 * Aggregates the per-entity repositories over one workbook snapshot (think
 * Doctrine's EntityManager). Domain services receive an EntityManager and
 * never touch matrices or stores directly.
 */
export class EntityManager {
  readonly clients: ClientRepository
  readonly crmNotes: CrmNoteRepository
  readonly tags: TagRepository
  readonly tagLinks: TagLinkRepository
  readonly jobs: JobRepository
  readonly pieces: PieceRepository
  readonly pieceItems: PieceItemRepository
  readonly inventory: InventoryRepository
  readonly lots: LotRepository
  readonly transactions: TransactionRepository
  readonly auditLog: AuditLogRepository
  readonly audit: AuditLogger

  constructor(
    tabs: TabAccess,
    readonly clock: Clock,
    actorProvider: () => string,
  ) {
    this.audit = new AuditLogger(tabs, clock, actorProvider)
    this.clients = new ClientRepository(tabs, this.audit)
    this.crmNotes = new CrmNoteRepository(tabs, this.audit)
    this.tags = new TagRepository(tabs, this.audit)
    this.tagLinks = new TagLinkRepository(tabs, this.audit)
    this.jobs = new JobRepository(tabs, this.audit)
    this.pieces = new PieceRepository(tabs, this.audit)
    this.pieceItems = new PieceItemRepository(tabs, this.audit)
    this.inventory = new InventoryRepository(tabs, this.audit)
    this.lots = new LotRepository(tabs, this.audit)
    this.transactions = new TransactionRepository(tabs, this.audit)
    this.auditLog = new AuditLogRepository(tabs)
  }
}

/** Actor for audit entries: the Google account email, or `local`. */
export function currentActor(): string {
  const email = useAuthStore.getState().user?.email ?? ''
  return email !== '' ? email : 'local'
}

/** EntityManager over the live workbook store (production wiring). */
export function createEntityManager(clock: Clock = new SystemClock()): EntityManager {
  return new EntityManager(workbookTabAccess(), clock, currentActor)
}
