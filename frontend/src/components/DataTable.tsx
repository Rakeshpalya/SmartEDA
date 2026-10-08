import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Database, ListFilter } from 'lucide-react';
import { TableRecord } from '../types';

interface DataTableProps {
  columns: string[];
  records: TableRecord[];
  headRecords?: TableRecord[];
  tailRecords?: TableRecord[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearchChange?: (query: string) => void;
  onSortChange?: (column: string) => void;
  currentSort?: { column: string; asc: boolean };
  isLoading?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  records,
  headRecords = [],
  tailRecords = [],
  totalRecords,
  currentPage,
  totalPages,
  onPageChange,
  onSearchChange,
  onSortChange,
  currentSort,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'paginated' | 'head' | 'tail'>('paginated');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const activeRecords =
    viewMode === 'head' ? headRecords : viewMode === 'tail' ? tailRecords : records;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search in records..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('paginated')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'paginated'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Full Paginated
            </button>
            <button
              onClick={() => setViewMode('head')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'head'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              head(10)
            </button>
            <button
              onClick={() => setViewMode('tail')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'tail'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              tail(10)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Database className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Showing <strong className="text-slate-800 dark:text-slate-200">{activeRecords.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalRecords}</strong> records
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xs flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              Loading dataset records...
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3.5 w-14 text-center font-mono text-[11px] text-slate-400">#</th>
              {columns.map((col) => {
                const isSorted = currentSort?.column === col;
                return (
                  <th
                    key={col}
                    onClick={() => onSortChange && onSortChange(col)}
                    className="py-2.5 px-3.5 whitespace-nowrap cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        currentSort?.asc ? (
                          <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeRecords.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">
                  <ListFilter className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No records matching your search query.
                </td>
              </tr>
            ) : (
              activeRecords.map((row, idx) => (
                <tr
                  key={row._index ?? idx}
                  className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors group"
                >
                  <td className="py-2 px-3.5 text-center font-mono text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                    {row._index ?? idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col];
                    const isNull = val === null || val === undefined || val === '';
                    return (
                      <td key={col} className="py-2 px-3.5 whitespace-nowrap">
                        {isNull ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-900/40">
                            NaN
                          </span>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {String(val)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {viewMode === 'paginated' && totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-slate-500">
            Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
              {currentPage}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
