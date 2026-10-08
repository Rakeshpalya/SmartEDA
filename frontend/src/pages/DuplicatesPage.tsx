import React, { useState, useEffect } from 'react';
import { CopyX, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DuplicateAnalysisResponse, OperationExplanation } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';

interface DuplicatesPageProps {
  onRefreshSummary: () => void;
}

export const DuplicatesPage: React.FC<DuplicatesPageProps> = ({ onRefreshSummary }) => {
  const [data, setData] = useState<DuplicateAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const res = await api.getDuplicatesAnalysis();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.removeDuplicates();
      setExplanation(res.explanation);
      onRefreshSummary();
      await fetchDuplicates();
    } catch (e: any) {
      alert(`Removal failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Checking for duplicate rows...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CopyX className="w-6 h-6 text-amber-500" />
              Duplicate Row Analysis & Deduplication
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
              df.duplicated()
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect identical observations and eliminate redundant records to prevent sample weight bias.
          </p>
        </div>

        <button
          onClick={fetchDuplicates}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Active Duplicate Rows</span>
          <span className={`text-2xl font-black block mt-1 ${data.duplicates_current > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {data.duplicates_current}
          </span>
          <span className="text-[11px] text-slate-500">{data.duplicates_percentage}% of current dataset</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Originally Detected</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">
            {data.duplicates_raw}
          </span>
          <span className="text-[11px] text-slate-500">In raw uncleaned file</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Duplicates Removed</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {data.duplicates_removed}
          </span>
          <span className="text-[11px] text-slate-500">Cleaned observations</span>
        </div>
      </div>

      {/* Action Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            {data.duplicates_current > 0 ? "Deduplication Required" : "No Duplicate Rows Present"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {data.duplicates_current > 0
              ? `Found ${data.duplicates_current} identical records. Removing them preserves sample independence.`
              : "Dataset is free from duplicate records (0%). Cleaned state verified."}
          </p>
        </div>

        {data.duplicates_current > 0 && (
          <button
            onClick={handleRemove}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors flex items-center gap-2 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            {isSubmitting ? "Removing..." : "Remove Duplicate Rows (drop_duplicates)"}
          </button>
        )}
      </div>

      {/* Sample Duplicated Records Table */}
      {data.sample_duplicates.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
            Sample Duplicate Records Identified
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  {Object.keys(data.sample_duplicates[0]).map((k) => (
                    <th key={k} className="py-2.5 px-3.5 whitespace-nowrap">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {data.sample_duplicates.map((row, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                    {Object.values(row).map((val: any, vIdx) => (
                      <td key={vIdx} className="py-2 px-3.5 whitespace-nowrap">
                        {String(val ?? 'NaN')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Explanation Card */}
      <ExplanationCard explanation={explanation} />
    </div>
  );
};
