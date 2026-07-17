import { describe, expect, it } from 'vitest'
import { Piece } from '@/Entity/Piece'
import { PieceService } from '@/Service/PieceService'
import { auditTrail, makeEm } from './helpers'

function makeService() {
  const context = makeEm()
  return { ...context, service: new PieceService(context.em) }
}

describe('createPiece', () => {
  it('creates a pending piece with units unset', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P2', job_id: 'J1' })
    const result = service.createPiece({ jobId: 'J1', name: ' Shell ', price: 5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.piece.id).toBe('P3')
    expect(result.piece.status).toBe('pending')
    expect(result.piece.units).toBeUndefined()
    expect(result.piece.name).toBe('Shell')
    expect(result.piece.createdAt).toBe('2026-07-16T12:00:00.000Z')
    expect(em.pieces.find('P3')?.price).toBe(5)
  })

  it('allows omitting the price', () => {
    const { service } = makeService()
    const result = service.createPiece({ jobId: 'J1', name: 'Free' })
    expect(result.ok && result.piece.price).toBeUndefined()
  })

  it('validates job, name and price', () => {
    const { service } = makeService()
    expect(service.createPiece({ jobId: ' ', name: 'X' })).toEqual({
      ok: false,
      error: 'pieces.validation.jobRequired',
    })
    expect(service.createPiece({ jobId: 'J1', name: ' ' })).toEqual({
      ok: false,
      error: 'pieces.validation.nameRequired',
    })
    expect(service.createPiece({ jobId: 'J1', name: 'X', price: -1 })).toEqual({
      ok: false,
      error: 'jobs.validation.priceInvalid',
    })
  })
})

describe('updatePiece', () => {
  function seeded() {
    const context = makeService()
    context.tabs.seed('pieces', { id: 'P1', job_id: 'J1', name: 'Old', status: 'done' })
    return context
  }

  it('updates name, price and units preserving status', () => {
    const { em, service } = seeded()
    const result = service.updatePiece('P1', { name: ' New ', price: 0, units: 3 })
    expect(result.ok).toBe(true)
    const piece = em.pieces.find('P1')
    expect(piece?.name).toBe('New')
    expect(piece?.price).toBe(0)
    expect(piece?.units).toBe(3)
    expect(piece?.status).toBe('done')
  })

  it('allows unsetting price and units', () => {
    const { em, service } = seeded()
    service.updatePiece('P1', { name: 'New', price: 2, units: 2 })
    service.updatePiece('P1', { name: 'New' })
    const piece = em.pieces.find('P1')
    expect(piece?.price).toBeUndefined()
    expect(piece?.units).toBeUndefined()
  })

  it('validates existence, name, price and units', () => {
    const { service } = seeded()
    expect(service.updatePiece('P9', { name: 'X' })).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
    expect(service.updatePiece('P1', { name: ' ' })).toEqual({
      ok: false,
      error: 'pieces.validation.nameRequired',
    })
    expect(service.updatePiece('P1', { name: 'X', price: -0.01 })).toEqual({
      ok: false,
      error: 'jobs.validation.priceInvalid',
    })
    expect(service.updatePiece('P1', { name: 'X', units: 0 })).toEqual({
      ok: false,
      error: 'pieces.statusNeedsUnits',
    })
    expect(service.updatePiece('P1', { name: 'X', units: 1.5 })).toEqual({
      ok: false,
      error: 'pieces.statusNeedsUnits',
    })
  })
})

describe('createPieceItem', () => {
  it('creates a line and rejects a duplicate active inventory line', () => {
    const { em, service } = makeService()
    const first = service.createPieceItem({ pieceId: 'P1', inventoryId: 'INV1', quantity: 2.5 })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.item.id).toBe('PI1')
    expect(em.pieceItems.find('PI1')?.quantity).toBe(2.5)
    expect(service.createPieceItem({ pieceId: 'P1', inventoryId: 'INV1', quantity: 1 })).toEqual({
      ok: false,
      error: 'pieces.validation.duplicateInventory',
    })
  })

  it('allows re-adding after the previous line was soft-deleted', () => {
    const { service } = makeService()
    service.createPieceItem({ pieceId: 'P1', inventoryId: 'INV1', quantity: 1 })
    service.deletePieceItem('PI1')
    expect(
      service.createPieceItem({ pieceId: 'P1', inventoryId: 'INV1', quantity: 2 }).ok,
    ).toBe(true)
  })

  it('validates inventory and quantity', () => {
    const { service } = makeService()
    expect(service.createPieceItem({ pieceId: 'P1', inventoryId: ' ', quantity: 1 })).toEqual({
      ok: false,
      error: 'pieces.validation.inventoryRequired',
    })
    expect(service.createPieceItem({ pieceId: 'P1', inventoryId: 'INV1', quantity: 0 })).toEqual({
      ok: false,
      error: 'pieces.validation.quantityPositive',
    })
    expect(service.createPieceItem({ pieceId: 'P1', inventoryId: 'INV1', quantity: NaN })).toEqual({
      ok: false,
      error: 'pieces.validation.quantityPositive',
    })
  })
})

describe('deletePieceItem', () => {
  it('soft deletes and audits a delete action', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '1' })
    const result = service.deletePieceItem('PI1')
    expect(result.ok).toBe(true)
    expect(em.pieceItems.find('PI1')?.isDeleted()).toBe(true)
    expect(auditTrail(tabs)).toEqual(['piece_item/delete/PI1'])
  })

  it('rejects unknown lines', () => {
    const { service } = makeService()
    expect(service.deletePieceItem('PI9')).toEqual({ ok: false, error: 'errors.actionFailed' })
  })
})

describe('updatePieceStatus', () => {
  function seededConsumable() {
    const context = makeService()
    const { tabs } = context
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', name: 'Shell', units: '2', status: 'pending' })
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '10' })
    tabs.seed('piece_items', { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: '0.055' })
    tabs.seed('inventory', { id: 'INV1', name: 'PLA', qty_current: '100' })
    tabs.seed('inventory', { id: 'INV2', name: 'Screws', qty_current: '1' })
    return context
  }

  it('rejects unknown pieces', () => {
    const { service } = makeService()
    const ghost = new Piece()
    ghost.id = 'P9'
    expect(service.updatePieceStatus(ghost, 'done')).toEqual({
      ok: false,
      error: 'errors.actionFailed',
    })
  })

  it('requires at least one active line to enter a consuming status', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', units: '1', status: 'pending' })
    expect(service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done')).toEqual({
      ok: false,
      error: 'pieces.statusNeedsLines',
    })
  })

  it('requires valid units to enter a consuming status', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', status: 'pending' })
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '1' })
    expect(service.updatePieceStatus(em.pieces.find('P1') as Piece, 'failed')).toEqual({
      ok: false,
      error: 'pieces.statusNeedsUnits',
    })
  })

  it('changes status without touching inventory when decrement is off', () => {
    const { em, service } = seededConsumable()
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done')
    expect(result.ok).toBe(true)
    expect(em.pieces.find('P1')?.status).toBe('done')
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(100)
  })

  it('decrements effective need (qty × units) rounded to 2 decimals', () => {
    const { em, service } = seededConsumable()
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done', {
      decrementInventory: true,
    })
    expect(result.ok).toBe(true)
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(80)
    expect(em.inventory.find('INV2')?.qtyCurrent).toBe(0.89)
  })

  it('reports every insufficient inventory with have/need and commits nothing', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', units: '3', status: 'pending' })
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '50' })
    tabs.seed('piece_items', { id: 'PI2', piece_id: 'P1', inventory_id: 'INVX', quantity: '1' })
    tabs.seed('inventory', { id: 'INV1', name: 'PLA', qty_current: '100' })
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done', {
      decrementInventory: true,
    })
    expect(result).toEqual({
      ok: false,
      error: 'pieces.statusInsufficientStockDetail',
      insufficient: [
        { inventoryId: 'INV1', name: 'PLA', have: 100, need: 150 },
        { inventoryId: 'INVX', name: 'INVX', have: 0, need: 3 },
      ],
    })
    expect(em.pieces.find('P1')?.status).toBe('pending')
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(100)
  })

  it('skips lines without a quantity when computing need', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', units: '2', status: 'pending' })
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '' })
    tabs.seed('inventory', { id: 'INV1', name: 'PLA', qty_current: '10' })
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done', {
      decrementInventory: true,
    })
    expect(result.ok).toBe(true)
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(10)
  })

  it('skips unknown inventory rows when restoring', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', units: '2', status: 'done' })
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INVX', quantity: '1' })
    // Reverting done → pending with restore for an inventory row that no longer exists.
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'pending', {
      restoreInventory: true,
    })
    expect(result.ok).toBe(true)
    expect(em.pieces.find('P1')?.status).toBe('pending')
  })

  it('floors adjusted quantities at 0 and zeroes non-finite results', () => {
    const { em, service, tabs } = makeService()
    tabs.seed('pieces', { id: 'P1', job_id: 'J1', units: '2', status: 'done' })
    tabs.seed('piece_items', { id: 'PI1', piece_id: 'P1', inventory_id: 'INV1', quantity: '1' })
    tabs.seed('piece_items', { id: 'PI2', piece_id: 'P1', inventory_id: 'INV2', quantity: '1e308' })
    tabs.seed('inventory', { id: 'INV1', name: 'Neg', qty_current: '-5' })
    tabs.seed('inventory', { id: 'INV2', name: 'Huge', qty_current: '5' })
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'pending', {
      restoreInventory: true,
    })
    expect(result.ok).toBe(true)
    // -5 + 2 = -3 → floored at 0; 5 + 2e308 = Infinity → zeroed.
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(0)
    expect(em.inventory.find('INV2')?.qtyCurrent).toBe(0)
  })

  it('restores inventory when reverting to pending with the flag', () => {
    const { em, service } = seededConsumable()
    service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done', { decrementInventory: true })
    const result = service.updatePieceStatus(em.pieces.find('P1') as Piece, 'pending', {
      restoreInventory: true,
    })
    expect(result.ok).toBe(true)
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(100)
    expect(em.inventory.find('INV2')?.qtyCurrent).toBe(1)
  })

  it('does not restore without the flag and ignores consuming→consuming moves', () => {
    const { em, service } = seededConsumable()
    service.updatePieceStatus(em.pieces.find('P1') as Piece, 'done', { decrementInventory: true })
    // done → failed keeps consumption; done → pending without flag keeps quantities.
    service.updatePieceStatus(em.pieces.find('P1') as Piece, 'failed', {
      decrementInventory: true,
    })
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(80)
    service.updatePieceStatus(em.pieces.find('P1') as Piece, 'pending')
    expect(em.inventory.find('INV1')?.qtyCurrent).toBe(80)
  })
})
