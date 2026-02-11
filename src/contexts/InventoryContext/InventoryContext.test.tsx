import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { InventoryProvider, useInventory } from './InventoryContext';

function wrapper({ children }: { children: React.ReactNode }) {
  return <InventoryProvider>{children}</InventoryProvider>;
}

describe('InventoryContext', () => {
  it('provides empty lists initially', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    expect(result.current.printers).toEqual([]);
    expect(result.current.filaments).toEqual([]);
    expect(result.current.consumables).toEqual([]);
  });

  it('addPrinter adds a printer with generated id', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    act(() => {
      result.current.addPrinter({ name: 'Ender 3', maxFilaments: 1, powerCost: 0 });
    });
    expect(result.current.printers).toHaveLength(1);
    expect(result.current.printers[0]).toMatchObject({ name: 'Ender 3', maxFilaments: 1, powerCost: 0 });
    expect(result.current.printers[0].id).toBe(1);
  });

  it('addFilament adds a filament with generated id', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    act(() => {
      result.current.addFilament({
        name: 'PLA Black',
        type: 'PLA',
        colour: 'Black',
        purchaseDate: '2026-01-01',
        gramsPerUnit: 1000,
        totalCost: 10,
        pricePerGram: 0.01,
        depleted: false,
      });
    });
    expect(result.current.filaments).toHaveLength(1);
    expect(result.current.filaments[0].name).toBe('PLA Black');
    expect(result.current.filaments[0].id).toBe(1);
  });

  it('addConsumable adds a consumable with generated id', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    act(() => {
      result.current.addConsumable({
        name: 'Luz',
        purchaseDate: '2026-01-01',
        quantity: 8,
        totalCost: 20,
        pricePerUnit: 2.5,
        depleted: false,
      });
    });
    expect(result.current.consumables).toHaveLength(1);
    expect(result.current.consumables[0].name).toBe('Luz');
    expect(result.current.consumables[0].id).toBe(1);
  });

  it('updateFilament updates by id', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    act(() => {
      result.current.addFilament({
        name: 'PLA Black',
        type: 'PLA',
        colour: 'Black',
        purchaseDate: '2026-01-01',
        gramsPerUnit: 1000,
        totalCost: 10,
        pricePerGram: 0.01,
        depleted: false,
      });
    });
    const id = result.current.filaments[0].id;
    act(() => {
      result.current.updateFilament(id, { name: 'PLA White', colour: 'White' });
    });
    expect(result.current.filaments[0].name).toBe('PLA White');
    expect(result.current.filaments[0].colour).toBe('White');
  });

  it('deletePrinter removes by id', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    act(() => {
      result.current.addPrinter({ name: 'Ender', maxFilaments: 1, powerCost: 0 });
    });
    const id = result.current.printers[0].id;
    act(() => result.current.deletePrinter(id));
    expect(result.current.printers).toHaveLength(0);
  });

  it('loadFromDatabase replaces printers, filaments, consumables', () => {
    const { result } = renderHook(() => useInventory(), { wrapper });
    const db = {
      version: '1.0.0',
      company: { name: '', defaultMarkup: 1.1, currency: '€', taxRate: 0 },
      printers: [{ id: 1, name: 'P1', maxFilaments: 2, powerCost: 0 }],
      filaments: [],
      consumables: [{ id: 1, name: 'C1', purchaseDate: '2026-01-01', quantity: 1, totalCost: 1, pricePerUnit: 1, depleted: false }],
      pieces: [],
      clients: [],
      sales: [],
      kanban: [],
    };
    act(() => result.current.loadFromDatabase(db));
    expect(result.current.printers).toHaveLength(1);
    expect(result.current.printers[0].name).toBe('P1');
    expect(result.current.consumables).toHaveLength(1);
    expect(result.current.consumables[0].name).toBe('C1');
    expect(result.current.filaments).toHaveLength(0);
  });

  it('useInventory throws when used outside InventoryProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useInventory())).toThrow(
      'useInventory must be used within InventoryProvider'
    );
    spy.mockRestore();
  });
});
