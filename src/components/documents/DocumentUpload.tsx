import { useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { moduleApi } from '@/api/client';
import { cn } from '@/lib/utils';

export const DOCUMENT_CATEGORIES = [
  { value: 'drawings', label: 'Drawings' },
  { value: 'contracts', label: 'Contracts' },
  { value: 'boq', label: 'BOQ' },
  { value: 'site_photos', label: 'Site Photos' },
  { value: 'daily_reports', label: 'Daily Reports' },
  { value: 'approvals', label: 'Approvals' },
  { value: 'quality', label: 'Quality' },
  { value: 'safety', label: 'Safety' },
  { value: 'procurement', label: 'Procurement' },
  { value: 'finance', label: 'Finance' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'other', label: 'Other' },
] as const;

interface DocumentUploadProps {
  projectId: string;
  category: string;
  multiple?: boolean;
  accept?: string;
  label?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  onUploaded: (docs: Array<{ _id: string; fileUrl: string; title: string }>) => void;
}

export function DocumentUpload({
  projectId, category, multiple, accept = 'image/*,.pdf', label, relatedEntityType, relatedEntityId, onUploaded,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      if (multiple && files.length > 1) {
        const fd = new FormData();
        for (const f of Array.from(files)) fd.append('files', f);
        fd.append('projectId', projectId);
        fd.append('category', category);
        if (relatedEntityType) fd.append('relatedEntityType', relatedEntityType);
        if (relatedEntityId) fd.append('relatedEntityId', relatedEntityId);
        const res = await moduleApi.documents.uploadMultiple(fd);
        onUploaded(res.data);
      } else {
        const results = [];
        for (const file of Array.from(files)) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('projectId', projectId);
          fd.append('category', category);
          fd.append('title', file.name);
          if (relatedEntityType) fd.append('relatedEntityType', relatedEntityType);
          if (relatedEntityId) fd.append('relatedEntityId', relatedEntityId);
          const res = await moduleApi.documents.upload(fd);
          results.push(res.data);
        }
        onUploaded(results);
      }
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple} onChange={(e) => upload(e.target.files)} />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn('flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-3 text-xs text-slate-400 hover:border-sky-500/40 hover:text-sky-300')}
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {label || (multiple ? 'Upload files' : 'Upload file')}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

export function DocumentThumb({ url, title, onRemove }: { url: string; title: string; onRemove?: () => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('image');
  return (
    <div className="relative group rounded-lg ring-1 ring-white/10 overflow-hidden">
      {isImage ? (
        <img src={url} alt={title} className="h-20 w-full object-cover" />
      ) : (
        <div className="flex h-20 items-center justify-center bg-white/5 text-[10px] text-slate-400 px-2 text-center">{title}</div>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} className="absolute right-1 top-1 rounded bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100">
          <X size={12} />
        </button>
      )}
    </div>
  );
}
