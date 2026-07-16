import { beforeEach, describe, expect, it } from 'vitest'
import { Tag } from '@/Entity/Tag'
import { createEntityManager, currentActor, EntityManager } from '@/Repository/EntityManager'
import { useAuthStore } from '@/Store/authStore'
import { useWorkbookStore } from '@/Store/workbookStore'
import { dataRows, FixedClock, makeEm, makeTabs } from '../Service/helpers'

describe('EntityManager wiring', () => {
  it('exposes one repository per sheet plus the audit log and logger', () => {
    const { em } = makeEm()
    expect(em.clients.findAll()).toEqual([])
    expect(em.crmNotes.findAll()).toEqual([])
    expect(em.tags.findAll()).toEqual([])
    expect(em.tagLinks.findAll()).toEqual([])
    expect(em.jobs.findAll()).toEqual([])
    expect(em.pieces.findAll()).toEqual([])
    expect(em.pieceItems.findAll()).toEqual([])
    expect(em.inventory.findAll()).toEqual([])
    expect(em.lots.findAll()).toEqual([])
    expect(em.transactions.findAll()).toEqual([])
    expect(em.auditLog.findAll()).toEqual([])
  })

  it('shares one audit logger and clock across repositories', () => {
    const tabs = makeTabs()
    const em = new EntityManager(tabs, new FixedClock('2026-02-03T04:05:06.000Z'), () => 'me@x.y')
    const tag = new Tag()
    tag.id = 'TG1'
    em.tags.save(tag)
    const entry = dataRows(tabs, 'audit_log')[0]
    expect(entry[1]).toBe('2026-02-03T04:05:06.000Z')
    expect(entry[2]).toBe('me@x.y')
  })
})

describe('currentActor', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
  })

  it('returns the signed-in Google email', () => {
    useAuthStore.setState({ user: { email: 'user@example.com', name: 'User' } })
    expect(currentActor()).toBe('user@example.com')
  })

  it('falls back to local when there is no user or no email', () => {
    expect(currentActor()).toBe('local')
    useAuthStore.setState({ user: { email: '', name: 'Local user' } })
    expect(currentActor()).toBe('local')
  })
})

describe('createEntityManager', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
    useAuthStore.setState({ user: null })
  })

  it('wires the live workbook store with the local actor fallback', () => {
    const em = createEntityManager(new FixedClock('2026-01-01T00:00:00.000Z'))
    const tag = new Tag()
    tag.id = 'TG1'
    tag.name = 'Live'
    em.tags.save(tag)
    const audit = useWorkbookStore.getState().tabs.audit_log[1]
    expect(audit[1]).toBe('2026-01-01T00:00:00.000Z')
    expect(audit[2]).toBe('local')
    expect(em.tags.find('TG1')?.name).toBe('Live')
  })

  it('defaults to the system clock', () => {
    const before = Date.now()
    const em = createEntityManager()
    const now = em.clock.now().getTime()
    expect(now).toBeGreaterThanOrEqual(before)
    expect(now).toBeLessThanOrEqual(Date.now())
  })
})
