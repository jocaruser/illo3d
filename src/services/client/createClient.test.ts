import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from './createClient'
import { matrixToClients } from '@/lib/workbook/workbookEntities'
import { useWorkbookStore } from '@/stores/workbookStore'
import { matrixWithRows, resetAndSeedWorkbook } from '@/test/workbookHarness'

describe('createClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    useWorkbookStore.getState().reset()
  })

  it('appends client row with CL1 when no CL-prefixed ids exist', async () => {
    resetAndSeedWorkbook({
      clients: matrixWithRows('clients', [
        {
          id: 'c1',
          name: 'Other',
          email: '',
          phone: '',
          notes: '',
          preferred_contact: '',
          lead_source: '',
          address: '',
          created_at: '2025-01-01',
        },
      ]),
    })

    await createClient('spreadsheet-1', {
      name: 'New Corp',
      email: 'n@example.com',
      phone: '+1',
      notes: 'Hi',
    })

    const clients = matrixToClients(useWorkbookStore.getState().tabs.clients)
    expect(clients.find((c) => c.id === 'CL1')).toMatchObject({
      id: 'CL1',
      name: 'New Corp',
      email: 'n@example.com',
      phone: '+1',
      notes: 'Hi',
      created_at: '2025-06-15',
    })
  })

  it('increments to CL3 when CL1 and CL2 exist', async () => {
    resetAndSeedWorkbook({
      clients: matrixWithRows('clients', [
        {
          id: 'CL1',
          name: 'A',
          email: '',
          phone: '',
          notes: '',
          preferred_contact: '',
          lead_source: '',
          address: '',
          created_at: '2025-01-01',
        },
        {
          id: 'CL2',
          name: 'B',
          email: '',
          phone: '',
          notes: '',
          preferred_contact: '',
          lead_source: '',
          address: '',
          created_at: '2025-01-01',
        },
      ]),
    })

    await createClient('spreadsheet-1', { name: 'Next' })

    const clients = matrixToClients(useWorkbookStore.getState().tabs.clients)
    expect(clients.find((c) => c.id === 'CL3')?.name).toBe('Next')
  })
})
