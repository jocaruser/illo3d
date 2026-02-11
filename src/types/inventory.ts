export type Printer = {
  id: number;
  name: string;
  maxFilaments: number;
  powerCost: number;
};

export type Filament = {
  id: number;
  name: string;
  type: string;
  colour: string;
  purchaseDate: string;
  gramsPerUnit: number;
  totalCost: number;
  pricePerGram: number;
  depleted: boolean;
};

export type Consumable = {
  id: number;
  name: string;
  purchaseDate: string;
  quantity: number;
  totalCost: number;
  pricePerUnit: number;
  depleted: boolean;
};
