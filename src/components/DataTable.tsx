import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  numeric?: boolean;
  semantic?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    return columns.map((col) => ({
      id: col.key,
      accessorKey: col.key as keyof T,
      header: col.label,
      ...(col.numeric ? { meta: { numeric: true } } : {}),
      cell: col.render
        ? (info) => col.render!(info.getValue() as unknown, info.row.original as T)
        : undefined,
    }));
  }, [columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (loading) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div
                      style={{
                        background: 'var(--md-sys-color-surface-container)',
                        borderRadius: '4px',
                        height: '16px',
                        width: '70%',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const col = columns.find((c) => c.key === header.column.id);
                return (
                  <th
                    key={header.id}
                    style={{
                      width: col?.width,
                      cursor: col?.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={
                      col?.sortable
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : typeof header.column.columnDef.header === 'function'
                        ? header.column.columnDef.header(header.getContext())
                        : header.column.columnDef.header}
                      {col?.sortable && (
                        <span style={{ opacity: 0.5 }}>
                          {header.column.getIsSorted() === 'asc'
                            ? ' ↑'
                            : header.column.getIsSorted() === 'desc'
                            ? ' ↓'
                            : ''}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
          {columns.some((c) => c.filterable) && (
            <tr>
              {columns.map((col) => (
                <th key={col.key}>
                  {col.filterable ? (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={(table.getColumn(col.key)?.getFilterValue() as string) ?? ''}
                      onChange={(e) =>
                        table.getColumn(col.key)?.setFilterValue(e.target.value)
                      }
                      style={{
                        width: '100%',
                        background: 'var(--md-sys-color-surface-container-low)',
                        border: '1px solid var(--md-sys-color-outline-variant)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: 'var(--md-sys-color-on-surface)',
                        fontSize: '12px',
                      }}
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row.original)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {row.getVisibleCells().map((cell) => {
                const col = columns.find((c) => c.key === cell.column.id);
                const value = cell.getValue();
                const isPositive = col?.semantic && typeof value === 'number' && value > 0;
                const isNegative = col?.semantic && typeof value === 'number' && value < 0;

                return (
                  <td
                    key={cell.id}
                    className={col?.numeric ? 'numeric' : undefined}
                    style={{
                      color: isPositive
                        ? 'var(--semantic-success)'
                        : isNegative
                        ? 'var(--semantic-danger)'
                        : undefined,
                    }}
                  >
                    {value != null ? String(value) : '—'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}