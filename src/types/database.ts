/**
 * Root structure for /illo3d-data/database.json (Google Drive app data).
 * Matches docs/database-schema.json and docs/context.txt.
 */
import type { Printer, Filament, Consumable } from './inventory';

export type Company = {
  name: string;
  defaultMarkup: number;
  currency: string;
  taxRate: number;
};

export type PieceFilament = { filamentId: number; grams: number };
export type PieceConsumable = { consumableId: number; quantity: number };
export type Piece = {
  id: number;
  name: string;
  printerId: number;
  filaments: PieceFilament[];
  consumables: PieceConsumable[];
  totalCost: number;
  notes: string;
};

export type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
};

export type SalePiece = { pieceId: number; quantity: number };
export type Sale = {
  id: number;
  date: string;
  description: string;
  clientId?: number;
  pieces: SalePiece[];
  price: number;
  totalCost: number;
  profit: number;
};

export type Database = {
  version: string;
  company: Company;
  printers: Printer[];
  filaments: Filament[];
  consumables: Consumable[];
  pieces: Piece[];
  clients: Client[];
  sales: Sale[];
  kanban: Record<string, unknown>[];
};

export const DEFAULT_DATABASE: Database = {
  version: '1.0.0',
  company: { name: '', defaultMarkup: 1.1, currency: '€', taxRate: 0 },
  printers: [],
  filaments: [],
  consumables: [],
  pieces: [],
  clients: [],
  sales: [],
  kanban: [],
};
