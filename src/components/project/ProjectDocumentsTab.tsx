import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ExternalLink, Send } from 'lucide-react';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { DOCUMENT_CATEGORIES } from '@/components/documents/DocumentUpload';
import { moduleApi } from '@/api/client';
import { cn } from '@/lib/utils';

export interface PlatformDoc {
  _id: string;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  uploadedBy?: string;
  uploadedAt: string;
  version: number;
  approvalStatus?: string;
  remarks?: string;
}

const APPROVAL_STYLE: Record<string, string> = {
  draft: 'text-slate-400',
  pending: 'text-amber-400',
  approved: 'text-emerald-400',
  rejected: 'text-red-400',
};

export function ProjectDocumentsTab({ projectId }: { projectId: string }) {
  const [docs, setDocs] = useState<PlatformDoc[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('drawings');
  const [title, setTitle] = useState('');
  const [remarks, setRemarks] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => moduleApi.documents.list(projectId).then((r) => setDocs(r.data));
  useEffect(() => { load(); }, [projectId]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile) return;
    setSaving(true);
    const fd = new FormData();
    fd.append('file', pendingFile);
    fd.append('projectId', projectId);
    fd.append('category', category);
    fd.append('title', title || pendingFile.name);
    if (remarks) fd.append('remarks', remarks);
    try {
      await moduleApi.documents.upload(fd);
      setModalOpen(false);
      setPendingFile(null);
      load();
    } finally { setSaving(false); }
  };

  const submitApproval = async (id: string) => {
    await moduleApi.documents.submitApproval(id);
    load();
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] text-slate-500">
          Powered by{' '}
          <Link to="/business/documents" className="text-sky-400 hover:underline">Enterprise Document Center</Link>
        </p>
      </div>
      <CrudTable
        title="Project documents"
        subtitle="Drawings · contracts · approvals — linked to this project"
        data={docs}
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-accent flex items-center gap-2 text-xs">
            <Plus size={14} /> Upload document
          </button>
        }
        columns={[
          { key: 'title', label: 'Title', render: (v, row) => (
            <Link to={`/business/documents/${row._id}`} className="text-sky-400 hover:underline">{String(v)}</Link>
          ) },
          { key: 'category', label: 'Category' },
          { key: 'version', label: 'v' },
          {
            key: 'approvalStatus',
            label: 'Approval',
            render: (v) => (
              <span className={cn('text-xs capitalize', APPROVAL_STYLE[String(v || 'draft')] || 'text-slate-400')}>
                {String(v || 'draft')}
              </span>
            ),
          },
          { key: 'uploadedBy', label: 'By', render: (v) => (v ? String(v) : '—') },
          { key: 'uploadedAt', label: 'Uploaded', render: (v) => new Date(String(v)).toLocaleDateString() },
          {
            key: '_id',
            label: '',
            render: (v, row) => (
              <div className="flex items-center gap-2">
                {row.approvalStatus === 'draft' && (
                  <button type="button" onClick={() => submitApproval(String(v))} className="text-amber-400 hover:text-amber-300" title="Submit for approval">
                    <Send size={12} />
                  </button>
                )}
                <a href={String(row.fileUrl)} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1 text-xs">
                  <ExternalLink size={12} />
                </a>
              </div>
            ),
          },
        ]}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Upload document">
        <form onSubmit={register} className="space-y-3">
          <SelectField label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectField>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          <input type="file" accept="image/*,.pdf" onChange={(e) => setPendingFile(e.target.files?.[0] || null)} className="text-xs text-slate-400" />
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} submitLabel="Upload" />
        </form>
      </Modal>
    </>
  );
}
