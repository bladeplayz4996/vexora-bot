import React, { useState, useMemo } from 'react';

export default function DataTableUI({
  columns = [],
  rows = [],
  searchPlaceholder = 'Search records...',
  emptyMessage = 'No records found.',
}) {
  const [query, setQuery] = useState('');

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((col) => {
        const raw = typeof col.accessor === 'function' ? col.accessor(row) : row?.[col.accessor];
        return String(raw ?? '').toLowerCase().includes(q);
      })
    );
  }, [rows, columns, query]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
        />
        <span className="text-xs text-slate-400">
          {filteredRows.length} of {rows.length} entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              {columns.map((col) => (
                <th key={col.key || col.label} className="px-3 py-2 font-semibold">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rIdx) => (
                <tr key={row.id || row.caseId || row.txId || rIdx} className="hover:bg-slate-800/40">
                  {columns.map((col) => {
                    const val =
                      typeof col.accessor === 'function' ? col.accessor(row) : row?.[col.accessor];
                    return (
                      <td key={col.key || col.label} className="px-3 py-2.5 text-slate-200">
                        {col.render ? col.render(row, val) : String(val ?? '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
