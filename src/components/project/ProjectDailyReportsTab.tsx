import { useState } from 'react';
import { Plus, Pencil, Send } from 'lucide-react';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, FormActions } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DocumentUpload, DocumentThumb } from '@/components/documents/DocumentUpload';
import { moduleApi } from '@/api/client';

export interface DailyReport {
  _id: string;
  reportDate: string;
  summary: string;
  weather?: string;
  delays?: string;
  progressPercent: number;
  reportedBy?: string;
  approvalStatus: string;
  photoDocumentIds?: string[];
  photoUrls?: string[];
}

export function ProjectDailyReportsTab({ projectId, reports, onRefresh }: { projectId: string; reports: DailyReport[]; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DailyReport | null>(null);
  const [form, setForm] = useState({
    reportDate: new Date().toISOString().slice(0, 10),
    summary: '', weather: '', delays: '', progressPercent: '0',
  });
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ reportDate: new Date().toISOString().slice(0, 10), summary: '', weather: '', delays: '', progressPercent: '0' });
    setPhotoIds([]);
    setPhotoUrls([]);
    setModalOpen(true);
  };

  const openEdit = (r: DailyReport) => {
    if (r.approvalStatus !== 'draft') return;
    setEditing(r);
    setForm({
      reportDate: r.reportDate.slice(0, 10),
      summary: r.summary,
      weather: r.weather || '',
      delays: r.delays || '',
      progressPercent: String(r.progressPercent),
    });
    setPhotoIds(r.photoDocumentIds || []);
    setPhotoUrls(r.photoUrls || []);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, progressPercent: Number(form.progressPercent), photoDocumentIds: photoIds, photoUrls };
    try {
      if (editing) await moduleApi.projects.updateDailyReport(projectId, editing._id, payload);
      else await moduleApi.projects.createDailyReport(projectId, payload);
      setModalOpen(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const submitReport = async (id: string) => {
    await moduleApi.projects.submitDailyReport(projectId, id);
    onRefresh();
  };

  return (
    <>
      <CrudTable
        title="Daily Progress"
        subtitle="Draft → submit → approval workflow"
        data={reports}
        actions={
          <button type="button" onClick={openCreate} className="btn-accent flex items-center gap-2 text-xs">
            <Plus size={14} /> New report
          </button>
        }
        columns={[
          { key: 'reportDate', label: 'Date', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'summary', label: 'Work summary' },
          { key: 'progressPercent', label: 'Progress', render: (v) => `${v}%` },
          { key: 'approvalStatus', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
          {
            key: '_id',
            label: 'Actions',
            render: (_, row) => {
              const r = row as DailyReport;
              return (
                <div className="flex gap-2">
                  {r.approvalStatus === 'draft' && (
                    <>
                      <button type="button" onClick={() => openEdit(r)} className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"><Pencil size={10} /> Edit</button>
                      <button type="button" onClick={() => submitReport(r._id)} className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"><Send size={10} /> Submit</button>
                    </>
                  )}
                </div>
              );
            },
          },
        ]}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit daily report' : 'New daily report'}>
        <form onSubmit={save} className="space-y-3">
          <TextField label="Date" type="date" required value={form.reportDate} onChange={(e) => setForm((f) => ({ ...f, reportDate: e.target.value }))} />
          <TextField label="Work summary" required value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
          <TextField label="Weather" value={form.weather} onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))} />
          <TextField label="Delays" value={form.delays} onChange={(e) => setForm((f) => ({ ...f, delays: e.target.value }))} />
          <TextField label="Progress %" value={form.progressPercent} onChange={(e) => setForm((f) => ({ ...f, progressPercent: e.target.value }))} />
          <div>
            <p className="mb-2 text-xs font-medium text-slate-700">Site photos</p>
            <DocumentUpload
              projectId={projectId}
              category="site_photos"
              multiple
              accept="image/*"
              label="Upload site photos"
              relatedEntityType="daily_report"
              onUploaded={(docs) => {
                setPhotoIds((ids) => [...ids, ...docs.map((d) => d._id)]);
                setPhotoUrls((urls) => [...urls, ...docs.map((d) => d.fileUrl)]);
              }}
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {photoUrls.map((url, i) => (
                <DocumentThumb key={url} url={url} title={`Photo ${i + 1}`} />
              ))}
            </div>
          </div>
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} submitLabel={editing ? 'Save draft' : 'Create draft'} />
        </form>
      </Modal>
    </>
  );
}
