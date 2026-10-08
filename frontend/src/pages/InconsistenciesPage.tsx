import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, RefreshCw, Wand2, Layers } from 'lucide-react';
import { api } from '../services/api';
import { InconsistentAnalysisResponse, OperationExplanation } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';

interface InconsistenciesPageProps {
  onRefreshSummary: () => void;
}

export const InconsistenciesPage: React.FC<InconsistenciesPageProps> = ({ onRefreshSummary }) => {
  const [data, setData] = useState<InconsistentAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [action, setAction] = useState<string>('canonical');
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInconsistencies = async () => {
    setLoading(true);
    try {
      const res = await api.getInconsistencies();
      setData(res);
      if (res.inconsistent_columns.length > 0) {
        setSelectedCol(res.inconsistent_columns[0].column);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInconsistencies();
  }, []);

  const handleApply = async () => {
    if (!selectedCol) return;
    setIsSubmitting(true);
    try {
      const res = await api.treatInconsistencies(selectedCol, action);
      setExplanation(res.explanation);
      onRefreshSummary();
      await fetchInconsistencies();
    } catch (e: any) {
      alert(`Normalization failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Scanning for text inconsistencies...</div>;
  }

  const activeColItem = data.inconsistent_columns.find((c) => c.column === selectedCol);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Inconsistent Value & Casing Detection
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
              Canonical Normalization
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect splintered categorical values caused by varying capitalization or accidental whitespace.
          </p>
        </div>

        <button
          onClick={fetchInconsistencies}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
          {data.total_found > 0
            ? `Found ${data.total_found} text feature(s) with formatting discrepancies in raw data`
            : "No formatting inconsistencies detected. Clean text formatting verified."}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inconsistent categories such as <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">"Male"</code> vs <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">"male"</code> or <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">" Bangalore"</code> split statistical counts. Normalizing them unifies valid categories in the cleaned dataset while preserving raw data intact.
        </p>
      </div>

      {/* Inconsistent Columns Cards */}
      {data.inconsistent_columns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.inconsistent_columns.map((c) => (
            <div
              key={c.column}
              onClick={() => setSelectedCol(c.column)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                selectedCol === c.column
                  ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm font-mono text-purple-700 dark:text-purple-300">
                  {c.column}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                  +{c.difference} duplicate category variants
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(c.variations).map(([norm, variants], vIdx) => (
                  <div key={vIdx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-500 block uppercase">
                      Canonical Entity: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">"{norm}"</strong>
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {variants.map((v, idx) => (
                        <span key={idx} className="font-mono text-[10px] px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-900/40">
                          "{v}"
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3-STAGE BEFORE / CLEANING OPERATION / AFTER PIPELINE */}
      {activeColItem && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Categorical Normalization Pipeline: '{selectedCol}'
              </h3>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono ${
              activeColItem.is_cleaned
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
            }`}>
              {activeColItem.is_cleaned ? '✓ Active Cleaned Data: Standardized' : '⚠ Active Cleaned Data: Needs Normalization'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            {/* 1. BEFORE — RAW DATA */}
            <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                    BEFORE — RAW DATA
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 font-bold">
                    {activeColItem.raw_unique_count} variants
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Original inconsistent entries preserved in raw dataset:</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeColItem.raw_counts &&
                    Object.entries(activeColItem.raw_counts).map(([cat, cnt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-rose-100 dark:border-rose-900/30">
                        <span className="font-mono text-slate-800 dark:text-slate-200">"{cat}"</span>
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{cnt}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* 2. CLEANING OPERATION */}
            <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 flex flex-col items-center text-center justify-center space-y-3 py-6">
              <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shadow-sm">
                ↓
              </div>
              <div>
                <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider block">
                  CLEANING OPERATION
                </span>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                  {activeColItem.operation_name || `${selectedCol.replace('_', ' ').toUpperCase()} Normalization`}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Canonical mapping & whitespace stripping maps splintered casing variants into standardized canonical classes.
                </p>
              </div>
              <div className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                {selectedCol.toLowerCase() === 'gender' ? 'male* → Male | female* → Female' : 'str.strip() → str.title()'}
              </div>
            </div>

            {/* 3. AFTER — CLEANED DATA */}
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    AFTER — CLEANED DATA
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 font-bold">
                    {activeColItem.clean_unique_count} canonical
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">Unified standardized categories in cleaned dataset:</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeColItem.clean_counts &&
                    Object.entries(activeColItem.clean_counts).map(([cat, cnt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">"{cat}"</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{cnt}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Normalization Controls */}
      {selectedCol && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-600" />
            Apply Normalization in '{selectedCol}'
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Transformation Method
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                <option value="canonical">Canonical Category Mapping & Whitespace Strip (e.g. 'Male' / 'Female' - Recommended)</option>
                <option value="titlecase">Strip whitespace & Title Case (e.g. 'Male', 'Bangalore')</option>
                <option value="lowercase">Strip whitespace & lowercase (e.g. 'male', 'bangalore')</option>
                <option value="uppercase">Strip whitespace & uppercase (e.g. 'MALE', 'BANGALORE')</option>
                <option value="strip_whitespace">Strip whitespace only (preserve casing)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isSubmitting ? "Normalizing..." : `Normalize Categorical Values in '${selectedCol}'`}
          </button>
        </div>
      )}

      {/* Educational Explanation */}
      <ExplanationCard explanation={explanation} />
    </div>
  );
};
