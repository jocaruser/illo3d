import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Printer, Filament, Consumable } from '../../types/inventory';

type InventoryContextValue = {
  printers: Printer[];
  filaments: Filament[];
  consumables: Consumable[];
  addPrinter: (data: Omit<Printer, 'id'>) => void;
  updatePrinter: (id: number, data: Partial<Omit<Printer, 'id'>>) => void;
  deletePrinter: (id: number) => void;
  addFilament: (data: Omit<Filament, 'id'>) => void;
  updateFilament: (id: number, data: Partial<Omit<Filament, 'id'>>) => void;
  deleteFilament: (id: number) => void;
  addConsumable: (data: Omit<Consumable, 'id'>) => void;
  updateConsumable: (id: number, data: Partial<Omit<Consumable, 'id'>>) => void;
  deleteConsumable: (id: number) => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function nextId(items: { id: number }[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((i) => i.id), 0) + 1;
}

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);

  const addPrinter = useCallback((data: Omit<Printer, 'id'>) => {
    setPrinters((prev) => [...prev, { ...data, id: nextId(prev) }]);
  }, []);
  const updatePrinter = useCallback((id: number, data: Partial<Omit<Printer, 'id'>>) => {
    setPrinters((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);
  const deletePrinter = useCallback((id: number) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addFilament = useCallback((data: Omit<Filament, 'id'>) => {
    setFilaments((prev) => [...prev, { ...data, id: nextId(prev) }]);
  }, []);
  const updateFilament = useCallback((id: number, data: Partial<Omit<Filament, 'id'>>) => {
    setFilaments((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
  }, []);
  const deleteFilament = useCallback((id: number) => {
    setFilaments((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addConsumable = useCallback((data: Omit<Consumable, 'id'>) => {
    setConsumables((prev) => [...prev, { ...data, id: nextId(prev) }]);
  }, []);
  const updateConsumable = useCallback((id: number, data: Partial<Omit<Consumable, 'id'>>) => {
    setConsumables((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);
  const deleteConsumable = useCallback((id: number) => {
    setConsumables((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      printers,
      filaments,
      consumables,
      addPrinter,
      updatePrinter,
      deletePrinter,
      addFilament,
      updateFilament,
      deleteFilament,
      addConsumable,
      updateConsumable,
      deleteConsumable,
    }),
    [
      printers,
      filaments,
      consumables,
      addPrinter,
      updatePrinter,
      deletePrinter,
      addFilament,
      updateFilament,
      deleteFilament,
      addConsumable,
      updateConsumable,
      deleteConsumable,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
