import React, { useState, useEffect } from 'react';
import { Columns, Trash2, Edit3, Wand2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { DatasetSummary, OperationExplanation } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';

interface ColumnCleanerPageProps {
  onRefreshSummary: () => void;
}

export const ColumnCleanerPage: React.FC<ColumnCleanerPageProps> = ({ onRefreshSummary }) => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [renameCol, setRenameCol] = useState('');
  const [newName, setNewName] = useState('');
  const [dropCol, setDropCol] = useState('');
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await api.getOverview();
      setSummary(res);
      if (res.column_names.length > 0) {
        setRenameCol(res.column_names[0]);
        setNewName(res.column_names[0]);
        setDropCol(res.column_names[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRename = async () => {
    if (!renameCol || !newName) return;
    setIsSubmitting(true);
    try {
      const res = await api.cleanColumns('rename', renameCol, newName);
      setExplanation(res.explanation);
      onRefreshSummary();
      await fetchOverview();
    } catch (e: any) {
      alert(`Rename failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDrop = async () => {
    if (!dropCol) return;
    if (!confirm(`Are you sure you want to drop column '${dropCol}'?`)) return;
    setIsSubmitting(true);
    try {
      const res = await api.cleanColumns('drop', dropCol);
      setExplanation(res.explanation);
      onRefreshSummary();
      await fetchOverview();
    } catch (e: any) {
      alert(`Drop failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStandardize = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.cleanColumns('standardize_names');
      setExplanation(res.explanation);
      onRefreshSummary();
      await fetchOverview();
    } catch (e: any) {
      alert(`Standardization failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !summary) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading column management...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Columns className="w-6 h-6 text-indigo-600" />
              Column Management & Normalization
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              Feature Schema
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rename headers, remove irrelevant ID or constant columns, and standardize column headers to snake_case.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Standardization Banner */}
      <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-600" />
            Auto-Standardize All Column Headers to snake_case
          </h4>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
            Converts messy headers (e.g. "Student Name" or "Study-Hours") to clean snake_case ("student_name", "study_hours").
          </p>
        </div>

        <button
          onClick={handleStandardize}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors shrink-0"
        >
          Standardize All Headers
        </button>
      </div>

      {/* Rename & Drop Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rename Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            Rename Specific Column
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Column to Rename
              </label>
              <select
                value={renameCol}
                onChange={(e) => {
                  setRenameCol(e.target.value);
                  setNewName(e.target.value);
                }}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                {summary.column_names.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                New Column Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. attendance_rate"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleRename}
            disabled={isSubmitting || !newName || newName === renameCol}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors"
          >
            Apply Column Rename
          </button>
        </div>

        {/* Drop Column Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-600" />
            Drop Column / Feature Elimination
          </h3>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Column to Eliminate
            </label>
            <select
              value={dropCol}
              onChange={(e) => setDropCol(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
            >
              {summary.column_names.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-2">
              Best for removing arbitrary identifiers (e.g. student_id) or columns with zero variance.
            </p>
          </div>

          <button
            onClick={handleDrop}
            disabled={isSubmitting || summary.column_names.length <= 1}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors"
          >
            Drop '{dropCol}' From Dataset
          </button>
        </div>
      </div>

      {/* Educational Explanation */}
      <ExplanationCard explanation={explanation} />
    </div>
  );
};
