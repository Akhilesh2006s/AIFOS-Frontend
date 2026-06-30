import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ChevronUp, Inbox, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import { TableSkeleton } from './TableSkeleton';

const VIRTUAL_THRESHOLD = 75;
const ROW_HEIGHT = 52;
const MAX_VIEWPORT_HEIGHT = 640;
const DEFAULT_PAGE_SIZE = 25;

export type SortDirection = 'asc' | 'desc';

interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
}

interface CrudTableProps<T extends { _id: string }> {
  title: string;
  subtitle?: string;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
  actions?: ReactNode;
  delay?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  footer?: ReactNode;
}

function TableRow<T extends { _id: string }>({
  row,
  columns,
  onEdit,
  onDelete,
  onRowClick,
}: {
  row: T;
  columns: Column<T>[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
}) {
  const hasActions = onEdit || onDelete;
  const clickable = Boolean(onRowClick);

  return (
    <tr
      className={cn('data-table-row', clickable && 'data-table-row-clickable cursor-pointer')}
      onClick={clickable ? () => onRowClick?.(row) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick?.(row); } } : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
    >
      {columns.map((col) => {
        const val = (row as Record<string, unknown>)[col.key as string];
        return (
          <td key={String(col.key)}>
            {col.render ? col.render(val, row) : String(val ?? '—')}
          </td>
        );
      })}
      {hasActions && (
        <td className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-end gap-0.5">
            {onEdit && (
              <button type="button" onClick={() => onEdit(row)} className="command-icon-btn" title="Edit" aria-label="Edit row">
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={() => onDelete(row)} className="command-icon-btn hover:bg-red-500/10 hover:text-red-400" title="Delete" aria-label="Delete row">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function compareValues(a: unknown, b: unknown, dir: SortDirection): number {
  const av = a ?? '';
  const bv = b ?? '';
  if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
  const as = String(av).toLowerCase();
  const bs = String(bv).toLowerCase();
  if (as < bs) return dir === 'asc' ? -1 : 1;
  if (as > bs) return dir === 'asc' ? 1 : -1;
  return 0;
}

export function CrudTable<T extends { _id: string }>({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  onEdit,
  onDelete,
  onRowClick,
  actions,
  delay = 0,
  emptyTitle = 'No records yet',
  emptyDescription = 'Create your first entry to get started.',
  pageSize = DEFAULT_PAGE_SIZE,
  searchPlaceholder,
  searchKeys,
  footer,
}: CrudTableProps<T>) {
  const hasActions = onEdit || onDelete;
  const colSpan = columns.length + (hasActions ? 1 : 0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (query.trim() && searchKeys?.length) {
      const q = query.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((k) => String((row as Record<string, unknown>)[k as string] ?? '').toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      rows.sort((a, b) =>
        compareValues(
          (a as Record<string, unknown>)[sortKey],
          (b as Record<string, unknown>)[sortKey],
          sortDir,
        ),
      );
    }
    return rows;
  }, [data, query, searchKeys, sortKey, sortDir]);

  const useVirtual = filtered.length >= VIRTUAL_THRESHOLD;
  const usePagination = !useVirtual && filtered.length > pageSize;
  const pageCount = usePagination ? Math.ceil(filtered.length / pageSize) : 1;
  const paged = usePagination
    ? filtered.slice(page * pageSize, (page + 1) * pageSize)
    : filtered;

  const virtualizer = useVirtualizer({
    count: useVirtual ? filtered.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const virtualItems = useVirtual ? virtualizer.getVirtualItems() : [];
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  const toggleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const displayRows = useVirtual ? filtered : paged;

  const tableBody = loading ? null : displayRows.length === 0 ? (
    <tr>
      <td colSpan={colSpan} className="table-empty-cell">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <div className="empty-state-icon">
            <Inbox size={26} className="text-slate-500" aria-hidden />
          </div>
          <p className="font-medium text-white">{emptyTitle}</p>
          <p className="mt-1.5 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      </td>
    </tr>
  ) : useVirtual ? (
    <>
      {paddingTop > 0 && <tr aria-hidden><td colSpan={colSpan} style={{ height: paddingTop, padding: 0, border: 0 }} /></tr>}
      {virtualItems.map((vi) => (
        <TableRow key={filtered[vi.index]._id} row={filtered[vi.index]} columns={columns} onEdit={onEdit} onDelete={onDelete} onRowClick={onRowClick} />
      ))}
      {paddingBottom > 0 && <tr aria-hidden><td colSpan={colSpan} style={{ height: paddingBottom, padding: 0, border: 0 }} /></tr>}
    </>
  ) : (
    displayRows.map((row) => (
      <TableRow key={row._id} row={row} columns={columns} onEdit={onEdit} onDelete={onDelete} onRowClick={onRowClick} />
    ))
  );

  return (
    <GlassCard delay={delay} noPadding className="overflow-hidden">
      <div
        className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        style={{ borderColor: 'var(--command-border)' }}
      >
        <div>
          <h3 className="text-heading-section">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {searchKeys && searchKeys.length > 0 && (
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder ?? 'Search…'}
              className="search-input min-w-[180px] py-2 pl-3"
              aria-label={`Search ${title}`}
            />
          )}
          {actions}
        </div>
      </div>
      {loading ? (
        <TableSkeleton rows={6} cols={columns.length} />
      ) : (
        <div
          ref={useVirtual ? scrollRef : undefined}
          className="overflow-x-auto scrollbar-thin"
          style={useVirtual ? { maxHeight: MAX_VIEWPORT_HEIGHT, overflowY: 'auto' } : undefined}
        >
          <table className="data-table" role="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={String(col.key)}
                    scope="col"
                    className={cn(col.sortable && 'data-table-th-sortable')}
                    aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-white"
                        onClick={() => toggleSort(String(col.key), col.sortable)}
                      >
                        {col.label}
                        {sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </button>
                    ) : col.label}
                  </th>
                ))}
                {hasActions && <th scope="col" className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>{tableBody}</tbody>
          </table>
        </div>
      )}
      {usePagination && !loading && (
        <div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-500" style={{ borderColor: 'var(--command-border)' }}>
          <span>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            {query ? ' (filtered)' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <span className="tabular-nums">Page {page + 1} of {pageCount}</span>
            <button type="button" className="btn-ghost btn-sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
      {footer}
    </GlassCard>
  );
}
