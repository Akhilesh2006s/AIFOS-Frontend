import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
}

export function TextField({ label, required, hint, id, ...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={fieldId} className="input-label">
        {label}{required && <span className="text-red-400" aria-hidden> *</span>}
      </label>
      <input id={fieldId} className="input-field" aria-required={required} required={required} {...props} />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, required, hint, children, id, ...props }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={fieldId} className="input-label">
        {label}{required && <span className="text-red-400" aria-hidden> *</span>}
      </label>
      <select id={fieldId} className="select-field" aria-required={required} required={required} {...props}>{children}</select>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ label, required, hint, id, ...props }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div>
      <label htmlFor={fieldId} className="input-label">
        {label}{required && <span className="text-red-400" aria-hidden> *</span>}
      </label>
      <textarea id={fieldId} className="textarea-field" aria-required={required} required={required} {...props} />
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function FormActions({ onCancel, submitLabel = 'Save', loading }: { onCancel: () => void; submitLabel?: string; loading?: boolean }) {
  return (
    <div className="form-divider flex justify-end gap-3">
      <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      <button type="submit" disabled={loading} className="btn-primary" aria-busy={loading}>
        {loading ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}
