import React, { useState, useEffect } from 'react';
import { Table2, HelpCircle, Eye, RefreshCw, FileText } from 'lucide-react';
import { api } from '../services/api';
import { RawTableResponse } from '../types';
import { DataTable } from '../components/DataTable';

interface RawDataPageProps {
  onRefreshSummary?: () => void;
}

export const RawDataPage: React.FC<RawDataPageProps> = () => {
  const [data, setData] = useState<RawTableResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [loading, setLoading] = useState(true);
  const [useRaw, setUseRaw] = useState(true);

  const fetchData = async (p = page, s = search, sc = sortCol, sa = sortAsc, raw = useRaw) => {
    setLoading(true);
    try {
      const res = await api.getRawTable({
        page: p,
        pageSize,
        search: s,
        sortBy: sc,
        sortAsc: sa,
        useRaw: raw,
      });
      setData(res);
      setPage(res.page);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, search, sortCol, sortAsc, useRaw);
  }, [useRaw]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchData(newPage, search, sortCol, sortAsc, useRaw);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchData(1, val, sortCol, sortAsc, useRaw);
  };

  const handleSortChange = (col: string) => {
    const isSame = sortCol === col;
    const newAsc = isSame ? !sortAsc : true;
    setSortCol(col);
    setSortAsc(newAsc);
    fetchData(page, search, col, newAsc, useRaw);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Table2 className="w-6 h-6 text-indigo-600" />
              Raw Dataset Inspection
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              {useRaw ? "Immutable Raw Copy" : "Current Active State"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Displaying the exact records as parsed from original storage. No rows fabricated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setUseRaw(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                useRaw
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Raw Uploaded Copy
            </button>
            <button
              onClick={() => setUseRaw(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !useRaw
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Current Cleaned State
            </button>
          </div>

          <button
            onClick={() => fetchData()}
            className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Educational Card: Why Inspect Head and Tail? */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-slate-900 dark:to-indigo-950/30 border border-blue-200/80 dark:border-indigo-900/50 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-2 font-bold text-xs text-blue-900 dark:text-blue-300 uppercase tracking-wide">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          Why are we inspecting the First and Last records (df.head() & df.tail())?
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {data?.educational_note.why_head_tail ||
            "Inspecting df.head() and df.tail() is a foundational step in data science. It enables the engineer to verify column alignment, catch potential header corruptions, preview sample values across varied rows, and identify trailing summary or aggregated rows (such as totals or timestamps) that could corrupt machine learning pipelines."}
        </p>
      </div>

      {/* Main Data Table */}
      {data ? (
        <DataTable
          columns={data.columns}
          records={data.records}
          headRecords={data.head_records}
          tailRecords={data.tail_records}
          totalRecords={data.total_records}
          currentPage={data.page}
          totalPages={data.total_pages}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          currentSort={{ column: sortCol, asc: sortAsc }}
          isLoading={loading}
        />
      ) : (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading raw records...
        </div>
      )}
    </div>
  );
};
