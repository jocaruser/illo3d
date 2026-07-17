import { describe, expect, it } from 'vitest'
import { Client } from '@/Entity/Client'

const record = {
  id: 'CL1',
  name: 'Acme',
  email: 'a@b.c',
  phone: '600',
  notes: 'note',
  preferred_contact: 'email',
  lead_source: 'web',
  address: 'Street 1',
  created_at: '2026-01-01',
  archived: '',
  deleted: 'true',
}

describe('Client', () => {
  it('round-trips fromRecord/toRecord', () => {
    const client = Client.fromRecord(record)
    expect(client.id).toBe('CL1')
    expect(client.preferredContact).toBe('email')
    expect(client.leadSource).toBe('web')
    expect(client.isDeleted()).toBe(true)
    expect(client.toRecord()).toEqual(record)
  })

  it('defaults every missing cell to empty string', () => {
    const client = Client.fromRecord({})
    expect(client.toRecord()).toEqual({
      id: '',
      name: '',
      email: '',
      phone: '',
      notes: '',
      preferred_contact: '',
      lead_source: '',
      address: '',
      created_at: '',
      archived: '',
      deleted: '',
    })
  })
})
