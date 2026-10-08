import React, { useState, useEffect } from 'react';
import {
  HelpCircle, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, RefreshCw, Check
} from 'lucide-react';
import { api } from '../services/api';
import { MissingAnalysisResponse, OperationExplanation, MissingColumnItem } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';

interface MissingValuesPageProps {
  onRefreshSummary: () => void;
}

interface LastTreatmentResult {
  column: string;
  before: number;
  after: number;
  methodLabel: string;
}

export const MissingValuesPage: React.FC<MissingValuesPageProps> = ({ onRefreshSummary }) => {
  const [data, setData] = useState<MissingAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [strategy, setStrategy] = useState<string>('median');
  const [customValue, setCustomValue] = useState<string>('');
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllCols, setShowAllCols] = useState(false);
  const [lastResult, setLastResult] = useState<LastTreatmentResult | null>(null);

  const fetchMissing = async () => {
    setLoading(true);
    try {
      const res = await api.getMissingAnalysis();
      setData(res);
      
      const candidates = res.columns.filter((c) => c.missing_current > 0);
      if (candidates.length > 0) {
        // Keep selected if still in candidates, otherwise pick first candidate
        const stillValid = candidates.find((c) => c.column === selectedCol);
        const colToSet = stillValid ? stillValid : candidates[0];
        setSelectedCol(colToSet.column);
        applyAutoStrategy(colToSet);
      } else {
        setSelectedCol('');
      }
    } catch (e) {
      console.error("Failed to load missing values analysis:", e);
    } finally {
      setLoading(false);
    }
  };

  const applyAutoStrategy = (colItem: MissingColumnItem) => {
    const isNum = colItem.role === 'Numerical' || colItem.dtype?.includes('int') || colItem.dtype?.includes('float');
    if (!isNum) {
      setStrategy('mode');
    } else {
      setStrategy(colItem.recommended_strategy !== 'none' ? colItem.recommended_strategy : 'median');
    }
  };

  useEffect(() => {
    fetchMissing();
  }, []);

  const handleSelectCol = (colName: string) => {
    setSelectedCol(colName);
    if (!data) return;
    const colItem = data.columns.find((c) => c.column === colName);
    if (colItem) {
      applyAutoStrategy(colItem);
    }
  };

  const handleApplyTreatment = async () => {
    if (!selectedCol || !data) return;
    const colItem = data.columns.find((c) => c.column === selectedCol);
    if (!colItem || colItem.missing_current === 0) return;

    setIsSubmitting(true);
    try {
      const strategyInfo = data.strategies_available.find((s) => s.strategy === strategy);
      const strategyLabel = strategyInfo ? strategyInfo.label : strategy;
      const beforeCount = colItem.missing_current;

      const res = await api.treatMissing(selectedCol, strategy, customValue);
      setExplanation(res.explanation);
      
      const afterCount = res.explanation?.after_count !== undefined ? res.explanation.after_count : 0;
      setLastResult({
        column: selectedCol,
        before: beforeCount,
        after: afterCount,
        methodLabel: strategyLabel
      });

      onRefreshSummary();
      await fetchMissing();
    } catch (e: any) {
      alert(`Treatment failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Auditing missing records...</div>;
  }

  const treatmentCandidates = data.columns.filter((c) => c.missing_current > 0);
  const currentColItem = data.columns.find((c) => c.column === selectedCol);
  const isSelectedNumeric = currentColItem
    ? (currentColItem.role === 'Numerical' || currentColItem.dtype?.includes('int') || currentColItem.dtype?.includes('float'))
    : true;

  // Filter valid strategies by column data type
  const allowedStrategies = data.strategies_available.filter((s) => {
    if (isSelectedNumeric) {
      // Don't show mode as primary recommendation for numerical
      return ['median', 'mean', 'constant', 'drop_rows', 'drop_column', 'ffill', 'bfill'].includes(s.strategy);
    } else {
      // Never allow mean or median for categorical columns
      return ['mode', 'constant', 'drop_rows', 'drop_column', 'ffill', 'bfill'].includes(s.strategy);
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-rose-500" />
              Missing Values Analysis & Treatment
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
              df.isnull().sum()
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect, quantify, and treat incomplete data records with domain-specific statistical imputation.
          </p>
        </div>

        <button
          onClick={fetchMissing}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          title="Refresh missing analysis"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Current Missing Cells</span>
          <span className={`text-2xl font-black block mt-1 ${data.total_missing_current > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {data.total_missing_current}
          </span>
          <span className="text-[11px] text-slate-500">Unresolved empty cells</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Raw Missing Cells</span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">
            {data.total_missing_raw}
          </span>
          <span className="text-[11px] text-slate-500">Originally detected</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Resolved Cells</span>
          <span className="text-2xl font-black text-emerald-600 block mt-1">
            {data.total_resolved}
          </span>
          <span className="text-[11px] text-slate-500">Successfully imputed or dropped</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Affected Features</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">
            {data.affected_columns_count}
          </span>
          <span className="text-[11px] text-slate-500">Columns containing NaNs</span>
        </div>
      </div>

      {/* Result Card After Imputation */}
      {lastResult && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                ✓ Missing Values Treated Successfully
              </h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Completed imputation on feature <strong className="font-mono">{lastResult.column}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs bg-white/80 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">BEFORE</span>
              <span className="text-sm font-black text-rose-600">{lastResult.before} missing</span>
            </div>
            <div className="text-slate-300 dark:text-slate-700 font-bold">→</div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">METHOD</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{lastResult.methodLabel}</span>
            </div>
            <div className="text-slate-300 dark:text-slate-700 font-bold">→</div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">AFTER</span>
              <span className="text-sm font-black text-emerald-600">{lastResult.after} missing</span>
            </div>
          </div>
        </div>
      )}

      {/* No Missing Values Banner */}
      {treatmentCandidates.length === 0 && (
        <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
            ✓ No Missing Values Found
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-lg mx-auto">
            All records in the current dataset are 100% complete with 0 missing cells. No imputation is necessary.
          </p>
        </div>
      )}

      {/* Treatment Form */}
      {treatmentCandidates.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Apply Missing Value Treatment
              </h3>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                checked={showAllCols}
                onChange={(e) => setShowAllCols(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              Show zero-missing columns in list
            </label>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                SELECT COLUMN WITH MISSING VALUES
              </label>
              <select
                value={selectedCol}
                onChange={(e) => handleSelectCol(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                {treatmentCandidates.map((c) => (
                  <option key={c.column} value={c.column}>
                    {c.column} ({c.missing_current} missing, {c.percentage}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Imputation Strategy
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
              >
                {allowedStrategies.map((s) => (
                  <option key={s.strategy} value={s.strategy}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {strategy === 'constant' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Custom Constant Value
                </label>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={isSelectedNumeric ? "e.g. 0" : "e.g. Unknown"}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Selected Column Live Detail Card */}
          {currentColItem && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Column</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {currentColItem.column}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Missing Values</span>
                <span className="font-bold text-rose-600 text-sm">
                  {currentColItem.missing_current} ({currentColItem.percentage}%)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Type</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  {currentColItem.role} ({currentColItem.dtype || 'auto'})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {currentColItem.recommended_strategy.toUpperCase()} IMPUTATION
                </span>
              </div>
            </div>
          )}

          {/* Strategy Context & Recommendation Guidance */}
          {currentColItem && (
            <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-xs mb-4 text-indigo-950 dark:text-indigo-200">
              <strong>Why Recommended: </strong>
              {currentColItem.why_recommendation ||
                (isSelectedNumeric
                  ? "The median is less sensitive to extreme values and is suitable when the distribution is skewed."
                  : "The mode imputes the most frequent class for categorical features.")}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleApplyTreatment}
            disabled={isSubmitting || !currentColItem || currentColItem.missing_current === 0}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center gap-2"
          >
            {isSubmitting
              ? "Applying Imputation..."
              : `Treat Missing Values in '${selectedCol}'`}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500">
          Treatment form is disabled because there are no missing values to treat.
        </div>
      )}

      {/* Interactive Missing Distribution Bars */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Missingness Distribution by Column
        </h3>

        <div className="space-y-3">
          {(showAllCols ? data.columns : data.columns.filter((c) => c.missing_raw > 0 || c.missing_current > 0)).map((col) => (
            <div
              key={col.column}
              onClick={() => {
                if (col.missing_current > 0) {
                  handleSelectCol(col.column);
                }
              }}
              className={`p-3 rounded-xl border transition-all ${
                col.missing_current > 0 ? "cursor-pointer" : "cursor-default"
              } ${
                selectedCol === col.column
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{col.column}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {col.role}
                  </span>
                  {col.resolved && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
                      ✓ Cleaned
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 font-mono">
                  <span className={col.missing_current > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-medium"}>
                    {col.missing_current} missing ({col.percentage}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    col.missing_current > 0 ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(col.percentage, col.missing_current > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Explanation for Teacher Evaluation */}
      <ExplanationCard explanation={explanation} />
    </div>
  );
};
