import { describe, expect, it } from 'vitest'
import { formatTagNameTitleCase, TagService } from '@/Service/TagService'
import { auditTrail, dataRows, makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  return { ...context, service: new TagService(context.em) }
}

describe('formatTagNameTitleCase', () => {
  it('title-cases each whitespace-separated word', () => {
    expect(formatTagNameTitleCase('vip client')).toBe('Vip Client')
    expect(formatTagNameTitleCase('  LOUD   name ')).toBe('Loud Name')
  })

  it('returns empty for blank input', () => {
    expect(formatTagNameTitleCase('   ')).toBe('')
  })
})

describe('addTagToEntity', () => {
  it('creates a Title Cased tag and links it', () => {
    const { em, service, tabs } = makeService()
    const result = service.addTagToEntity('client', 'CL1', ' vip client ')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.tag.id).toBe('TG1')
    expect(result.tag.name).toBe('Vip Client')
    expect(result.tag.createdAt).toBe('2026-07-16T12:00:00.000Z')
    const link = em.tagLinks.find('TL1')
    expect(link?.tagId).toBe('TG1')
    expect(link?.entityType).toBe('client')
    expect(link?.entityId).toBe('CL1')
    expect(link?.createdAt).toBe('2026-07-16T12:00:00.000Z')
    expect(auditTrail(tabs)).toEqual(['tag/create/TG1', 'tag_link/create/TL1'])
  })

  it('reuses an existing tag case-insensitively', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('tags', { id: 'TG7', name: 'Vip Client' })
    const result = service.addTagToEntity('job', 'J1', 'VIP CLIENT')
    expect(result.ok && result.tag.id).toBe('TG7')
    expect(em.tags.findAll()).toHaveLength(1)
    expect(em.tagLinks.find('TL1')?.tagId).toBe('TG7')
  })

  it('is a no-op when the link already exists', () => {
    const { em, service } = makeService()
    service.addTagToEntity('client', 'CL1', 'Vip')
    const again = service.addTagToEntity('client', 'CL1', 'vip')
    expect(again.ok).toBe(true)
    expect(em.tagLinks.findAll()).toHaveLength(1)
  })

  it('rejects blank names', () => {
    const { service } = makeService()
    expect(service.addTagToEntity('client', 'CL1', '  ')).toEqual({
      ok: false,
      error: 'purchase.validation.required',
    })
  })
})

describe('removeTagFromEntity', () => {
  it('hard-deletes the matching link only', () => {
    const { em, service, tabs } = makeService()
    service.addTagToEntity('client', 'CL1', 'Vip')
    service.addTagToEntity('client', 'CL1', 'Slow')
    service.removeTagFromEntity('client', 'CL1', 'TG1')
    expect(dataRows(tabs, 'tag_links').map((row) => row[0])).toEqual(['TL2'])
    expect(em.tags.findAll()).toHaveLength(2)
    expect(auditTrail(tabs)).toContain('tag_link/delete/TL1')
  })

  it('is a no-op when nothing matches', () => {
    const { service, tabs } = makeService()
    service.removeTagFromEntity('client', 'CL1', 'TG9')
    expect(auditTrail(tabs)).toEqual([])
  })
})

describe('listTagsForEntity', () => {
  it('returns the active tags linked to the entity', () => {
    const { service, tabs } = makeService()
    tabs.seed('tags', { id: 'TG1', name: 'Active' })
    tabs.seed('tags', { id: 'TG2', name: 'Archived tag', archived: 'true' })
    tabs.seed('tag_links', { id: 'TL1', tag_id: 'TG1', entity_type: 'client', entity_id: 'CL1' })
    tabs.seed('tag_links', { id: 'TL2', tag_id: 'TG2', entity_type: 'client', entity_id: 'CL1' })
    tabs.seed('tag_links', { id: 'TL3', tag_id: 'TG9', entity_type: 'client', entity_id: 'CL1' })
    tabs.seed('tag_links', {
      id: 'TL4',
      tag_id: 'TG1',
      entity_type: 'client',
      entity_id: 'CL1',
      deleted: 'true',
    })
    expect(service.listTagsForEntity('client', 'CL1').map((tag) => tag.id)).toEqual(['TG1'])
    expect(service.listTagsForEntity('job', 'J1')).toEqual([])
  })
})
