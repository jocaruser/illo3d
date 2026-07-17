import { describe, expect, it } from 'vitest'
import { Client } from '@/Entity/Client'
import { CrmNote } from '@/Entity/CrmNote'
import { InventoryItem } from '@/Entity/InventoryItem'
import { Job } from '@/Entity/Job'
import { Piece } from '@/Entity/Piece'
import { Tag } from '@/Entity/Tag'
import { Transaction } from '@/Entity/Transaction'
import {
  clientSearchBlob,
  crmNoteSearchBlob,
  inventorySearchBlob,
  jobSearchBlob,
  joinSearchParts,
  moneySearchFragments,
  pieceSearchBlob,
  tagSearchBlob,
  transactionSearchBlob,
} from '@/Service/Search/searchBlobs'

const t = (key: string) => `[${key}]`

describe('joinSearchParts', () => {
  it('skips undefined and blank parts and trims the rest', () => {
    expect(joinSearchParts(['a', undefined, ' ', ' b '])).toBe('a \n b')
  })
})

describe('moneySearchFragments', () => {
  it('spells numbers as raw, 2dp and comma-decimal', () => {
    expect(moneySearchFragments(12.5)).toEqual(['12.5', '12.50', '12,50'])
    expect(moneySearchFragments(7)).toEqual(['7', '7.00', '7,00'])
    expect(moneySearchFragments(-3.25)).toEqual(['-3.25', '-3,25'])
  })

  it('is empty for unset values', () => {
    expect(moneySearchFragments(undefined)).toEqual([])
  })
})

describe('entity blobs', () => {
  it('clientSearchBlob includes ids, contact fields and tag names', () => {
    const client = Client.fromRecord({
      id: 'CL1',
      name: 'Acme',
      email: 'a@b.c',
      phone: '600',
      notes: 'note',
      preferred_contact: 'email',
      lead_source: 'web',
      address: 'Street',
      created_at: '2026-01-01',
    })
    const blob = clientSearchBlob(client, 'Vip Slow')
    for (const token of ['CL1', 'Acme', 'a@b.c', '600', 'note', 'email', 'web', 'Street', 'Vip Slow']) {
      expect(blob).toContain(token)
    }
    expect(clientSearchBlob(client)).not.toContain('Vip')
  })

  it('jobSearchBlob includes client name, translated status, dates and money spellings', () => {
    const job = Job.fromRecord({
      id: 'J1',
      client_id: 'CL1',
      description: 'Lamp',
      status: 'in_progress',
      price: '12.5',
      created_at: '2026-01-01T00:00:00.000Z',
      due_date: '2026-02-01',
    })
    const blob = jobSearchBlob(job, { clientName: 'Acme', tagNamesLine: 'Vip' }, t)
    for (const token of [
      'J1',
      'CL1',
      'Acme',
      'Lamp',
      'in_progress',
      '[jobs.status.in_progress]',
      '2026-02-01',
      '12,50',
      'Vip',
    ]) {
      expect(blob).toContain(token)
    }
  })

  it('pieceSearchBlob includes the job label, translated status and units', () => {
    const piece = Piece.fromRecord({
      id: 'P1',
      job_id: 'J1',
      name: 'Shell',
      status: 'done',
      units: '4',
      created_at: '2026-01-01T00:00:00.000Z',
    })
    const blob = pieceSearchBlob(piece, { jobLabel: 'J1 — Lamp' }, t)
    for (const token of ['P1', 'J1 — Lamp', 'Shell', '[pieces.status.done]', '4']) {
      expect(blob).toContain(token)
    }
    const unitless = Piece.fromRecord({ id: 'P2', job_id: 'J1', name: 'X' })
    expect(pieceSearchBlob(unitless, { jobLabel: 'J1' }, t)).not.toContain('undefined')
  })

  it('crmNoteSearchBlob includes body, mentions, severity and parent', () => {
    const note = CrmNote.fromRecord({
      id: 'CN1',
      entity_type: 'client',
      entity_id: 'CL1',
      body: 'call @J1',
      referenced_entity_ids: 'J1',
      severity: 'danger',
      created_at: '2026-01-01T00:00:00.000Z',
    })
    const blob = crmNoteSearchBlob(note, { parentLabel: 'Acme' }, t)
    for (const token of ['CN1', 'call @J1', 'J1', 'client', '[clientDetail.severity.danger]', 'Acme']) {
      expect(blob).toContain(token)
    }
  })

  it('transactionSearchBlob includes type labels, refs and money spellings', () => {
    const transaction = Transaction.fromRecord({
      id: 'T1',
      date: '2026-01-15',
      type: 'expense',
      amount: '-29.99',
      category: 'filament',
      concept: 'PLA spool',
      ref_type: 'job',
      ref_id: 'J1',
      client_id: 'CL1',
      notes: 'ref 442',
    })
    const blob = transactionSearchBlob(transaction, { clientLabel: 'Acme' }, t)
    for (const token of [
      'T1',
      '2026-01-15',
      '[transactions.type.expense]',
      '-29,99',
      'filament',
      'PLA spool',
      'job',
      'J1',
      'ref 442',
      'Acme',
    ]) {
      expect(blob).toContain(token)
    }
  })

  it('inventorySearchBlob includes translated type, thresholds and colour', () => {
    const item = InventoryItem.fromRecord({
      id: 'INV1',
      type: 'filament',
      name: 'PLA Red',
      qty_current: '750',
      warn_yellow: '500',
      warn_orange: '250',
      warn_red: '100',
      created_at: '2026-01-01T00:00:00.000Z',
      colour: '#ff0000',
    })
    const blob = inventorySearchBlob(item, t)
    for (const token of ['INV1', '[inventory.type.filament]', 'PLA Red', '750', '500', '250', '100', '#ff0000']) {
      expect(blob).toContain(token)
    }
  })

  it('tagSearchBlob includes the raw and Title Cased name', () => {
    const tag = Tag.fromRecord({ id: 'TG1', name: 'vip client', created_at: '2026-01-01' })
    const blob = tagSearchBlob(tag)
    expect(blob).toContain('vip client')
    expect(blob).toContain('Vip Client')
    expect(blob).toContain('TG1')
  })
})
