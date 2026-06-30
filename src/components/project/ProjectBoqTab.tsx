import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { RowAvatar } from '@/components/ui/TableCells';
import { moduleApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';

export interface BoqLine {
  _id: string;
  itemCode: string;
  category?: string;
  description: string;
  unit: string;
  plannedQty: number;
  unitRate: number;
  totalAmount: number;
  itemType: string;
}

const emptyLine = {
  itemCode: '', category: 'General', description: '', unit: 'nos',
  plannedQty: '1', unitRate: '0', itemType: 'material',
};

const ACCENT = '#38BDF8';

export function ProjectBoqTab({ projectId, lines, onRefresh }: { projectId: string; lines: BoqLine[]; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BoqLine | null>(null);
  const [form, setForm] = useState(emptyLine);
  const [saving, setSaving] = useState(false);

  const openCreate = () => { setEditing(null); setForm(emptyLine); setModalOpen(true); };
  const openEdit = (l: BoqLine) => {
    setEditing(l);
    setForm({
      itemCode: l.itemCode, category: l.category || 'General', description: l.description,
      unit: l.unit, plannedQty: String(l.plannedQty), unitRate: String(l.unitRate), itemType: l.itemType,
    });
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      plannedQty: Number(form.plannedQty),
      unitRate: Number(form.unitRate),
    };
    try {
      if (editing) await moduleApi.projects.updateBoqLine(projectId, editing._id, payload);
      else await moduleApi.projects.createBoqLine(projectId, payload);
      setModalOpen(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this BOQ line?')) return;
    await moduleApi.projects.deleteBoqLine(projectId, id);
    onRefresh();
  };

  const grouped = useMemo(() => {
    const map = new Map<string, BoqLine[]>();
    for (const line of lines) {
      const cat = line.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(line);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [lines]);

  const totalValue = lines.reduce((s, l) => s + (l.totalAmount || 0), 0);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const tableColumns = [
    { key: 'itemCode', label: 'Code' },
    { key: 'description', label: 'Item', render: (v: unknown) => <RowAvatar name={String(v)} color={ACCENT} /> },
    { key: 'plannedQty', label: 'Qty' },
    { key: 'unit', label: 'Unit' },
    { key: 'unitRate', label: 'Rate', render: (v: unknown) => formatCurrency(Number(v)) },
    { key: 'totalAmount', label: 'Amount', render: (v: unknown) => formatCurrency(Number(v)) },
    {
      key: '_id',
      label: '',
      render: (_: unknown, row: BoqLine) => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEdit(row)} className="p-1 text-slate-500 hover:text-white"><Pencil size={14} /></button>
          <button type="button" onClick={() => remove(row._id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{lines.length} lines · {grouped.length} categories · {formatCurrency(totalValue)} total</p>
        <button type="button" onClick={openCreate} className="btn-accent flex items-center gap-2 text-xs">
          <Plus size={14} /> Add line
        </button>
      </div>
      {grouped.length === 0 ? (
        <div className="command-card p-8 text-center text-sm text-slate-500">No BOQ lines — add items to start the material workflow.</div>
      ) : (
        grouped.map(([category, catLines]) => (
          <CrudTable
            key={category}
            title={category}
            subtitle={`${catLines.length} item(s)`}
            data={catLines}
            columns={tableColumns}
          />
        ))
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit BOQ line' : 'Add BOQ line'}>
        <form onSubmit={submit} className="space-y-3">
          <TextField label="Item code" required value={form.itemCode} onChange={set('itemCode')} />
          <TextField label="Category" value={form.category} onChange={set('category')} />
          <TextField label="Description" required value={form.description} onChange={set('description')} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Quantity" required value={form.plannedQty} onChange={set('plannedQty')} />
            <TextField label="Unit" required value={form.unit} onChange={set('unit')} />
          </div>
          <TextField label="Unit rate (₹)" value={form.unitRate} onChange={set('unitRate')} />
          <SelectField label="Type" value={form.itemType} onChange={set('itemType')}>
            <option value="material">Material</option>
            <option value="equipment">Equipment</option>
            <option value="service">Service</option>
          </SelectField>
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} />
        </form>
      </Modal>
    </>
  );
}
