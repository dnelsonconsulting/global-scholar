'use client';

import React from 'react';

interface Column<T> {
  label: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface LookupTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onDeactivate?: (id: string) => void;
  onReactivate?: (id: string) => void;
  onEdit?: (id: string) => void;
  getId: (row: T) => string;
  getIsActive: (row: T) => boolean;
  // Optionally, add onEdit or other actions here
}

export default function LookupTable<T>({
  columns,
  data,
  loading,
  error,
  emptyMessage = 'No records found.',
  onDeactivate,
  onReactivate,
  onEdit,
  getId,
  getIsActive,
}: LookupTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col, i) => (
                <th key={i} className={`p-2 text-left ${col.className || ''}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-4 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const id = getId(row);
                const isActive = getIsActive(row);
                return (
                  <tr key={id} className={!isActive ? 'text-gray-400 bg-gray-50' : ''}>
                    {columns.map((col, i) => (
                      <td key={i} className={`p-2 ${col.className || ''}`}>
                        {i === 0 && onEdit ? (
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800 transition-colors text-left w-full"
                            style={{ textDecoration: 'none' }}
                            onClick={() => onEdit(id)}
                          >
                            {typeof col.accessor === 'function'
                              ? col.accessor(row)
                              : (row as any)[col.accessor]}
                          </button>
                        ) : (
                          typeof col.accessor === 'function'
                            ? col.accessor(row)
                            : (row as any)[col.accessor]
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
} 