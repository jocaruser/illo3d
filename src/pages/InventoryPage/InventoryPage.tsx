import { useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useInventory } from '../../contexts/InventoryContext';
import type { Printer, Filament, Consumable } from '../../types/inventory';
import { Button } from '../../atoms/Button';
import { Checkbox } from '../../atoms/Checkbox';
import { Input } from '../../atoms/Input';
import { Label } from '../../atoms/Label';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputLayout } from '../../layouts/InputLayout';
import { TabsLayout } from '../../layouts/TabsLayout';
import styles from './InventoryPage.module.css';

type Tab = 'filaments' | 'consumables' | 'printers';

type FormState =
  | { type: 'printer'; id: number | null; data: Omit<Printer, 'id'> }
  | { type: 'filament'; id: number | null; data: Omit<Filament, 'id'> }
  | { type: 'consumable'; id: number | null; data: Omit<Consumable, 'id'> };

const defaultPrinter = (): Omit<Printer, 'id'> => ({
  name: '',
  maxFilaments: 1,
  powerCost: 0,
});
const defaultFilament = (): Omit<Filament, 'id'> => ({
  name: '',
  type: 'PLA',
  colour: '',
  purchaseDate: '',
  gramsPerUnit: 0,
  totalCost: 0,
  pricePerGram: 0,
  depleted: false,
});
const defaultConsumable = (): Omit<Consumable, 'id'> => ({
  name: '',
  purchaseDate: '',
  quantity: 0,
  totalCost: 0,
  pricePerUnit: 0,
  depleted: false,
});

export function InventoryPage() {
  const { t } = useI18n();
  const inv = useInventory();
  const [activeTab, setActiveTab] = useState<Tab>('filaments');
  const [form, setForm] = useState<FormState | null>(null);

  function openAddPrinter() {
    setForm({ type: 'printer', id: null, data: defaultPrinter() });
  }
  function openEditPrinter(p: Printer) {
    setForm({ type: 'printer', id: p.id, data: { name: p.name, maxFilaments: p.maxFilaments, powerCost: p.powerCost } });
  }
  function openAddFilament() {
    setForm({ type: 'filament', id: null, data: defaultFilament() });
  }
  function openEditFilament(f: Filament) {
    setForm({
      type: 'filament',
      id: f.id,
      data: {
        name: f.name,
        type: f.type,
        colour: f.colour,
        purchaseDate: f.purchaseDate,
        gramsPerUnit: f.gramsPerUnit,
        totalCost: f.totalCost,
        pricePerGram: f.pricePerGram,
        depleted: f.depleted,
      },
    });
  }
  function openAddConsumable() {
    setForm({ type: 'consumable', id: null, data: defaultConsumable() });
  }
  function openEditConsumable(c: Consumable) {
    setForm({
      type: 'consumable',
      id: c.id,
      data: {
        name: c.name,
        purchaseDate: c.purchaseDate,
        quantity: c.quantity,
        totalCost: c.totalCost,
        pricePerUnit: c.pricePerUnit,
        depleted: c.depleted,
      },
    });
  }

  function closeForm() {
    setForm(null);
  }

  function submitForm() {
    if (!form) return;
    if (form.type === 'printer') {
      if (form.id === null) inv.addPrinter(form.data);
      else inv.updatePrinter(form.id, form.data);
    } else if (form.type === 'filament') {
      if (form.id === null) inv.addFilament(form.data);
      else inv.updateFilament(form.id, form.data);
    } else {
      if (form.id === null) inv.addConsumable(form.data);
      else inv.updateConsumable(form.id, form.data);
    }
    closeForm();
  }

  function deletePrinter(id: number) {
    if (window.confirm(t('inventory.delete') + '?')) inv.deletePrinter(id);
    if (form?.type === 'printer' && form.id === id) closeForm();
  }
  function deleteFilament(id: number) {
    if (window.confirm(t('inventory.delete') + '?')) inv.deleteFilament(id);
    if (form?.type === 'filament' && form.id === id) closeForm();
  }
  function deleteConsumable(id: number) {
    if (window.confirm(t('inventory.delete') + '?')) inv.deleteConsumable(id);
    if (form?.type === 'consumable' && form.id === id) closeForm();
  }

  return (
    <main className={styles.root}>
      <h2 className={styles.title}>{t('inventory.title')}</h2>

      <TabsLayout
        activeTabId={activeTab}
        onTabChange={(id) => { setActiveTab(id as Tab); setForm(null); }}
        tabs={[
          { id: 'filaments', label: t('inventory.tabFilaments') },
          { id: 'consumables', label: t('inventory.tabConsumables') },
          { id: 'printers', label: t('inventory.tabPrinters') },
        ]}
      />

      {form?.type === 'printer' && (
        <div className={styles.formPanel}>
          <InputLayout>
            <Label htmlFor="printer-name">{t('inventory.name')}</Label>
            <Input
              id="printer-name"
              value={form.data.name}
              onChange={(v) => setForm({ ...form, data: { ...form.data, name: v } })}
            />
          </InputLayout>
          <InputLayout>
            <Label htmlFor="printer-max">{t('inventory.maxFilaments')}</Label>
            <Input
              id="printer-max"
              value={String(form.data.maxFilaments)}
              onChange={(v) => setForm({ ...form, data: { ...form.data, maxFilaments: parseInt(v, 10) || 0 } })}
            />
          </InputLayout>
          <InputLayout>
            <Label htmlFor="printer-power">{t('inventory.powerCost')}</Label>
            <Input
              id="printer-power"
              value={String(form.data.powerCost)}
              onChange={(v) => setForm({ ...form, data: { ...form.data, powerCost: parseFloat(v) || 0 } })}
            />
          </InputLayout>
          <div className={styles.formActions}>
            <Button variant="primary" onClick={submitForm}>
              {form.id === null ? t('inventory.addPrinter') : t('inventory.save')}
            </Button>
            <Button variant="default" onClick={closeForm}>
              {t('inventory.cancel')}
            </Button>
          </div>
        </div>
      )}

      {form?.type === 'filament' && (
        <div className={styles.formPanel}>
          <div className={styles.formRow}>
            <InputLayout>
              <Label htmlFor="filament-name">{t('inventory.name')}</Label>
              <Input
                id="filament-name"
                value={form.data.name}
                onChange={(v) => setForm({ ...form, data: { ...form.data, name: v } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="filament-type">{t('inventory.type')}</Label>
              <Input
                id="filament-type"
                value={form.data.type}
                onChange={(v) => setForm({ ...form, data: { ...form.data, type: v } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="filament-colour">{t('inventory.colour')}</Label>
              <Input
                id="filament-colour"
                value={form.data.colour}
                onChange={(v) => setForm({ ...form, data: { ...form.data, colour: v } })}
              />
            </InputLayout>
          </div>
          <div className={styles.formRow}>
            <InputLayout>
              <Label htmlFor="filament-date">{t('inventory.purchaseDate')}</Label>
              <Input
                id="filament-date"
                value={form.data.purchaseDate}
                onChange={(v) => setForm({ ...form, data: { ...form.data, purchaseDate: v } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="filament-grams">{t('inventory.grams')}</Label>
              <Input
                id="filament-grams"
                value={String(form.data.gramsPerUnit)}
                onChange={(v) => setForm({ ...form, data: { ...form.data, gramsPerUnit: parseFloat(v) || 0 } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="filament-total">{t('inventory.totalCost')}</Label>
              <Input
                id="filament-total"
                value={String(form.data.totalCost)}
                onChange={(v) => setForm({ ...form, data: { ...form.data, totalCost: parseFloat(v) || 0 } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="filament-ppgram">{t('inventory.pricePerGram')}</Label>
              <Input
                id="filament-ppgram"
                value={String(form.data.pricePerGram)}
                onChange={(v) => setForm({ ...form, data: { ...form.data, pricePerGram: parseFloat(v) || 0 } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="filament-depleted">{t('inventory.depleted')}</Label>
              <Checkbox
                id="filament-depleted"
                checked={form.data.depleted}
                onChange={(checked) => setForm({ ...form, data: { ...form.data, depleted: checked } })}
                aria-label={t('inventory.depleted')}
              />
            </InputLayout>
          </div>
          <div className={styles.formActions}>
            <Button variant="primary" onClick={submitForm}>
              {form.id === null ? t('inventory.addFilament') : t('inventory.save')}
            </Button>
            <Button variant="default" onClick={closeForm}>
              {t('inventory.cancel')}
            </Button>
          </div>
        </div>
      )}

      {form?.type === 'consumable' && (
        <div className={styles.formPanel}>
          <div className={styles.formRow}>
            <InputLayout>
              <Label htmlFor="consumable-name">{t('inventory.name')}</Label>
              <Input
                id="consumable-name"
                value={form.data.name}
                onChange={(v) => setForm({ ...form, data: { ...form.data, name: v } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="consumable-date">{t('inventory.purchaseDate')}</Label>
              <Input
                id="consumable-date"
                value={form.data.purchaseDate}
                onChange={(v) => setForm({ ...form, data: { ...form.data, purchaseDate: v } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="consumable-qty">{t('inventory.quantity')}</Label>
              <Input
                id="consumable-qty"
                value={String(form.data.quantity)}
                onChange={(v) => setForm({ ...form, data: { ...form.data, quantity: parseFloat(v) || 0 } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="consumable-total">{t('inventory.totalCost')}</Label>
              <Input
                id="consumable-total"
                value={String(form.data.totalCost)}
                onChange={(v) => setForm({ ...form, data: { ...form.data, totalCost: parseFloat(v) || 0 } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="consumable-ppu">{t('inventory.pricePerUnit')}</Label>
              <Input
                id="consumable-ppu"
                value={String(form.data.pricePerUnit)}
                onChange={(v) => setForm({ ...form, data: { ...form.data, pricePerUnit: parseFloat(v) || 0 } })}
              />
            </InputLayout>
            <InputLayout>
              <Label htmlFor="consumable-depleted">{t('inventory.depleted')}</Label>
              <Checkbox
                id="consumable-depleted"
                checked={form.data.depleted}
                onChange={(checked) => setForm({ ...form, data: { ...form.data, depleted: checked } })}
                aria-label={t('inventory.depleted')}
              />
            </InputLayout>
          </div>
          <div className={styles.formActions}>
            <Button variant="primary" onClick={submitForm}>
              {form.id === null ? t('inventory.addConsumable') : t('inventory.save')}
            </Button>
            <Button variant="default" onClick={closeForm}>
              {t('inventory.cancel')}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'filaments' && (
        <>
          <div className={styles.toolbar}>
            <Button variant="primary" onClick={openAddFilament}>
              {t('inventory.addFilament')}
            </Button>
          </div>
          <DataTable value={inv.filaments} dataKey="id" tableStyle={{ minWidth: '50rem' }}>
            <Column field="name" header={t('inventory.name')} />
            <Column field="type" header={t('inventory.type')} />
            <Column field="colour" header={t('inventory.colour')} />
            <Column field="gramsPerUnit" header={t('inventory.grams')} />
            <Column field="pricePerGram" header={t('inventory.pricePerGram')} />
            <Column
              field="depleted"
              header={t('inventory.depleted')}
              body={(f: Filament) => (
                <span className={f.depleted ? styles.depleted : ''}>
                  {f.depleted ? t('inventory.yes') : t('inventory.no')}
                </span>
              )}
            />
            <Column
              header=""
              body={(f: Filament) => (
                <div className={styles.actions}>
                  <Button variant="default" size="sm" onClick={() => openEditFilament(f)}>
                    {t('inventory.edit')}
                  </Button>
                  <Button variant="default" size="sm" onClick={() => deleteFilament(f.id)}>
                    {t('inventory.delete')}
                  </Button>
                </div>
              )}
            />
          </DataTable>
        </>
      )}

      {activeTab === 'consumables' && (
        <>
          <div className={styles.toolbar}>
            <Button variant="primary" onClick={openAddConsumable}>
              {t('inventory.addConsumable')}
            </Button>
          </div>
          <DataTable value={inv.consumables} dataKey="id" tableStyle={{ minWidth: '50rem' }}>
            <Column field="name" header={t('inventory.name')} />
            <Column field="purchaseDate" header={t('inventory.purchaseDate')} />
            <Column field="quantity" header={t('inventory.quantity')} />
            <Column field="totalCost" header={t('inventory.totalCost')} />
            <Column field="pricePerUnit" header={t('inventory.pricePerUnit')} />
            <Column
              field="depleted"
              header={t('inventory.depleted')}
              body={(c: Consumable) => (
                <span className={c.depleted ? styles.depleted : ''}>
                  {c.depleted ? t('inventory.yes') : t('inventory.no')}
                </span>
              )}
            />
            <Column
              header=""
              body={(c: Consumable) => (
                <div className={styles.actions}>
                  <Button variant="default" size="sm" onClick={() => openEditConsumable(c)}>
                    {t('inventory.edit')}
                  </Button>
                  <Button variant="default" size="sm" onClick={() => deleteConsumable(c.id)}>
                    {t('inventory.delete')}
                  </Button>
                </div>
              )}
            />
          </DataTable>
        </>
      )}

      {activeTab === 'printers' && (
        <>
          <div className={styles.toolbar}>
            <Button variant="primary" onClick={openAddPrinter}>
              {t('inventory.addPrinter')}
            </Button>
          </div>
          <DataTable value={inv.printers} dataKey="id" tableStyle={{ minWidth: '50rem' }}>
            <Column field="name" header={t('inventory.name')} />
            <Column field="maxFilaments" header={t('inventory.maxFilaments')} />
            <Column field="powerCost" header={t('inventory.powerCost')} />
            <Column
              header=""
              body={(p: Printer) => (
                <div className={styles.actions}>
                  <Button variant="default" size="sm" onClick={() => openEditPrinter(p)}>
                    {t('inventory.edit')}
                  </Button>
                  <Button variant="default" size="sm" onClick={() => deletePrinter(p.id)}>
                    {t('inventory.delete')}
                  </Button>
                </div>
              )}
            />
          </DataTable>
        </>
      )}
    </main>
  );
}
