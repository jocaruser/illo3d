import { describe, expect, it } from 'vitest'
import { ClientService } from '@/Service/ClientService'
import { auditTrail, makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  return { ...context, service: new ClientService(context.em) }
}

describe('createClient', () => {
  it('creates a client with the next id and a day-precision createdAt', () => {
    const { em, tabs, service } = makeService()
    tabs.seed('clients', { id: 'CL4', name: 'Existing' })
    const result = service.createClient({
      name: '  Acme  ',
      email: 'a@b.c',
      phone: '600',
      notes: 'vip',
      preferredContact: 'email',
      leadSource: 'web',
      address: 'Street 1',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.client.id).toBe('CL5')
    expect(result.client.name).toBe('Acme')
    expect(result.client.createdAt).toBe('2026-07-16')
    expect(em.clients.find('CL5')?.email).toBe('a@b.c')
    expect(auditTrail(tabs)).toEqual(['client/create/CL5'])
  })

  it('defaults optional fields to empty strings', () => {
    const { em, service } = makeService()
    const result = service.createClient({ name: 'Solo' })
    expect(result.ok).toBe(true)
    const client = em.clients.find('CL1')
    expect(client?.email).toBe('')
    expect(client?.phone).toBe('')
    expect(client?.notes).toBe('')
    expect(client?.preferredContact).toBe('')
    expect(client?.leadSource).toBe('')
    expect(client?.address).toBe('')
  })

  it('rejects blank names with the i18n key', () => {
    const { tabs, service } = makeService()
    expect(service.createClient({ name: '   ' })).toEqual({
      ok: false,
      error: 'clients.nameRequired',
    })
    expect(auditTrail(tabs)).toEqual([])
  })
})

describe('updateClient', () => {
  it('updates fields while preserving createdAt and lifecycle', () => {
    const { em, tabs, service } = makeService()
    tabs.seed('clients', {
      id: 'CL1',
      name: 'Old',
      created_at: '2025-01-01',
      archived: 'true',
    })
    const result = service.updateClient('CL1', { name: ' New ', email: 'n@x.y' })
    expect(result.ok).toBe(true)
    const client = em.clients.find('CL1')
    expect(client?.name).toBe('New')
    expect(client?.email).toBe('n@x.y')
    expect(client?.createdAt).toBe('2025-01-01')
    expect(client?.isArchived()).toBe(true)
    expect(auditTrail(tabs)).toEqual(['client/update/CL1'])
  })

  it('rejects unknown ids and blank names', () => {
    const { tabs, service } = makeService()
    tabs.seed('clients', { id: 'CL1', name: 'Kept' })
    expect(service.updateClient('CL9', { name: 'X' })).toEqual({
      ok: false,
      error: 'clientDetail.notFound',
    })
    expect(service.updateClient('CL1', { name: '' })).toEqual({
      ok: false,
      error: 'clients.nameRequired',
    })
    expect(auditTrail(tabs)).toEqual([])
  })
})
