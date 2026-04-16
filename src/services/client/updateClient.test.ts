import { describe, it, expect, beforeEach } from 'vitest'
import { updateClient } from './updateClient'
import { matrixToClients } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('updateClient', () => {
  beforeEach(() => {
    useWorkbookStore.getState().reset()
  })

  it('updates row by client id', async () => {
    resetAndSeedWorkbook({
      clients: matrixWithRows('clients', [
        {
          id: 'CL1',
          name: 'Old',
          email: 'o@x.com',
          phone: '',
          notes: '',
          preferred_contact: '',
          lead_source: '',
          address: '',
          created_at: '2025-01-01',
        },
      ]),
    })

    await updateClient('s1', 'CL1', {
      name: 'New',
      email: 'n@x.com',
      phone: '+1',
      notes: 'Hi',
      preferred_contact: 'Email',
      lead_source: '',
      address: '',
    })

    const clients = matrixToClients(useWorkbookStore.getState().tabs.clients)
    expect(clients[0]).toMatchObject({
      id: 'CL1',
      name: 'New',
      email: 'n@x.com',
      phone: '+1',
      notes: 'Hi',
      preferred_contact: 'Email',
      created_at: '2025-01-01',
    })
  })

  it('throws when client missing', async () => {
    resetAndSeedWorkbook({})

    await expect(updateClient('s1', 'CL9', { name: 'X' })).rejects.toThrow(
      'Client CL9 not found',
    )
  })
})
