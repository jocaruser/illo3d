import { describe, expect, it } from 'vitest'
import { Tag } from '@/Entity/Tag'
import { inferAction } from '@/Repository/AbstractSheetRepository'
import { auditTrail, dataRows, makeEm } from '../Service/helpers'

describe('inferAction', () => {
  it('covers the full lifecycle-transition table', () => {
    expect(inferAction({ deleted: '' }, { deleted: 'true' })).toBe('delete')
    expect(inferAction({ archived: '' }, { archived: 'true' })).toBe('archive')
    expect(inferAction({ archived: 'true', deleted: '' }, { archived: 'true', deleted: 'true' })).toBe(
      'delete',
    )
    expect(inferAction({ deleted: 'true' }, { deleted: '' })).toBe('restore')
    expect(inferAction({ archived: 'true' }, { archived: '' })).toBe('restore')
    // Clearing archived while still deleted counts as a restore of that flag.
    expect(inferAction({ archived: 'true', deleted: 'true' }, { deleted: 'true' })).toBe('restore')
    expect(inferAction({ name: 'a' }, { name: 'b' })).toBe('update')
    expect(inferAction({}, {})).toBe('update')
  })

  it('delete wins when both flags flip at once', () => {
    expect(inferAction({}, { archived: 'true', deleted: 'true' })).toBe('delete')
  })
})

describe('AbstractSheetRepository', () => {
  function seededTags() {
    const context = makeEm()
    context.tabs.seed('tags', { id: 'TG1', name: 'One' })
    context.tabs.seed('tags', { id: 'TG2', name: 'Two', archived: 'true' })
    return context
  }

  it('findAll hydrates entity classes for every row', () => {
    const { em } = seededTags()
    const tags = em.tags.findAll()
    expect(tags).toHaveLength(2)
    expect(tags[0]).toBeInstanceOf(Tag)
    expect(tags.map((tag) => tag.id)).toEqual(['TG1', 'TG2'])
  })

  it('findActive filters archived and deleted rows', () => {
    const { em } = seededTags()
    expect(em.tags.findActive().map((tag) => tag.id)).toEqual(['TG1'])
  })

  it('find returns the entity or null', () => {
    const { em } = seededTags()
    expect(em.tags.find('TG2')?.name).toBe('Two')
    expect(em.tags.find('TG9')).toBeNull()
  })

  it('nextId continues from the highest existing suffix', () => {
    const { em } = seededTags()
    expect(em.tags.nextId()).toBe('TG3')
  })

  it('save appends unknown ids and audits a create', () => {
    const { em, tabs } = makeEm()
    const tag = new Tag()
    tag.id = 'TG1'
    tag.name = 'Fresh'
    em.tags.save(tag)
    expect(dataRows(tabs, 'tags')).toHaveLength(1)
    expect(auditTrail(tabs)).toEqual(['tag/create/TG1'])
  })

  it('save replaces known ids and audits the inferred action', () => {
    const { em, tabs } = seededTags()
    const tag = em.tags.find('TG1') as Tag
    tag.name = 'Renamed'
    em.tags.save(tag)
    tag.archived = 'true'
    em.tags.save(tag)
    tag.archived = ''
    em.tags.save(tag)
    tag.deleted = 'true'
    em.tags.save(tag)
    expect(auditTrail(tabs)).toEqual([
      'tag/update/TG1',
      'tag/archive/TG1',
      'tag/restore/TG1',
      'tag/delete/TG1',
    ])
  })

  it('save records the cascade parent in the audit entry', () => {
    const { em, tabs } = makeEm()
    const tag = new Tag()
    tag.id = 'TG1'
    em.tags.save(tag, { entityName: 'client', entityId: 'CL1' })
    const entry = dataRows(tabs, 'audit_log')[0]
    expect(entry[9]).toBe('client')
    expect(entry[10]).toBe('CL1')
  })

  it('remove hard-deletes the row and audits a delete', () => {
    const { em, tabs } = seededTags()
    em.tags.remove('TG1')
    expect(dataRows(tabs, 'tags').map((row) => row[0])).toEqual(['TG2'])
    expect(auditTrail(tabs)).toEqual(['tag/delete/TG1'])
  })

  it('remove is a no-op for unknown ids', () => {
    const { em, tabs } = seededTags()
    em.tags.remove('TG9')
    expect(dataRows(tabs, 'tags')).toHaveLength(2)
    expect(auditTrail(tabs)).toEqual([])
  })
})
