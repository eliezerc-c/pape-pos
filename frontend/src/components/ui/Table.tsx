import React from 'react';

interface TableProps {
  headers: Array<{ key: string; label: string; className?: string }>;
  data: Record<string, unknown>[];
  renderRow: (item: Record<string, unknown>, index: number) => React.ReactNode;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

export const Table: React.FC<TableProps> = ({ headers, data, renderRow, className = '', loading = false, emptyMessage = 'No hay datos' }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-sm ${className}`}>
        <thead>
          <tr className="border-b border-gray-800">
            {headers.map((header) => (
              <th key={header.key} className={`text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${header.className || ''}`}>
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
};
