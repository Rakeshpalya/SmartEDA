import React, { useState, useEffect } from 'react';
import { Type, CheckCircle2, ArrowRight, RefreshCw, Wand2, Hash, Tag, Calendar, Key } from 'lucide-react';
import { api } from '../services/api';
import { InspectionResponse, OperationExplanation } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';

interface DataTypesPageProps {
  onRefreshSummary: () => void;
}

export const DataTypesPage: React.FC<DataTypesPageProps> = ({ onRefreshSummary }) => {
  const [data, setData] = useState<InspectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [targetType, setTargetType] = useState<string>('numeric');
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getInspection();
      setData(res);
      if (res.columns.length > 0) {
        setSelectedCol(res.columns[0].column);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConvert = async () => {
    if (!selectedCol) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateDatatype(selectedCol, targetType);
      setExplanation(res.explanation);
      onRefreshSummary();
      await fetchData();
    } catch (e: any) {
      alert(`Type conversion failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Classifying column types...</div>;
  }

  const roleCounts = data.columns.reduce((acc, c) => {
    acc[c.role] = (acc[c.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Type className="w-6 h-6 text-indigo-600" />
              Data Type Classification & Casting
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              astype() & pd.to_numeric()
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ensure proper numerical and categorical representation to prevent runtime type errors in mathematical models.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Role Counts Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Numerical</span>
            <Hash className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {roleCounts['Numerical'] || 0}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Continuous & Discrete</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Categorical</span>
            <Tag className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {roleCounts['Categorical'] || 0}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Labels & Groups</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Datetime</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {roleCounts['Datetime'] || 0}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Time Series timestamps</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">ID / Unique</span>
            <Key className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {roleCounts['ID'] || 0}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Identifiers (Non-predictive)</span>
        </div>
      </div>

      {/* Type Conversion Tool */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-indigo-600" />
          Explicit Type Casting Interface
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Select Column
            </label>
            <select
              value={selectedCol}
              onChange={(e) => setSelectedCol(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
            >
              {data.columns.map((c) => (
                <option key={c.column} value={c.column}>
                  {c.column} (current: {c.dtype})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Target Data Type
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
            >
              <option value="numeric">pd.to_numeric (Float / Int)</option>
              <option value="category">astype('category')</option>
              <option value="string">astype(str)</option>
              <option value="datetime">pd.to_datetime</option>
              <option value="boolean">astype(bool)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors flex items-center gap-2"
        >
          {isSubmitting ? "Converting..." : `Cast '${selectedCol}' to ${targetType}`}
        </button>
      </div>

      {/* Columns Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          All Column Types & Recommendations
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3.5">Column</th>
                <th className="py-2.5 px-3.5">Current Dtype</th>
                <th className="py-2.5 px-3.5">Detected Role</th>
                <th className="py-2.5 px-3.5">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.columns.map((c) => (
                <tr key={c.column} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3.5 font-bold font-mono text-slate-900 dark:text-white">{c.column}</td>
                  <td className="py-2.5 px-3.5 font-mono text-slate-500">{c.dtype}</td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {c.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-medium">{c.recommended_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational Explanation */}
      <ExplanationCard explanation={explanation} />
    </div>
  );
};
