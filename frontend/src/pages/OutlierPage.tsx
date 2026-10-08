import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, ArrowRight, RefreshCw, Scissors, Sparkles, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { OutlierAnalysisResponse, OperationExplanation, DatasetSummary } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';

interface OutlierPageProps {
  onRefreshSummary: () => void;
}

export const OutlierPage: React.FC<OutlierPageProps> = ({ onRefreshSummary }) => {
  const [numCols, setNumCols] = useState<string[]>([]);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [method, setMethod] = useState<'iqr' | 'zscore'>('iqr');
  const [threshold, setThreshold] = useState<number>(1.5);
  const [action, setAction] = useState<'clip' | 'remove'>('clip');
  const [analysis, setAnalysis] = useState<OutlierAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getOverview().then((res) => {
      const nums = Object.entries(res.column_types)
        .filter(([_, t]) => t === 'Numerical')
        .map(([c]) => c);
      setNumCols(nums);
      if (nums.length > 0) {
        setSelectedCol(nums[0]);
        loadOutliers(nums[0], method, threshold);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadOutliers = async (col: string, m = method, t = threshold) => {
    setLoading(true);
    try {
      const res = await api.getOutlierAnalysis(col, m, t);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCol = (col: string) => {
    setSelectedCol(col);
    loadOutliers(col, method, threshold);
  };

  const handleMethodChange = (newMethod: 'iqr' | 'zscore') => {
    setMethod(newMethod);
    const newT = newMethod === 'iqr' ? 1.5 : 3.0;
    setThreshold(newT);
    loadOutliers(selectedCol, newMethod, newT);
  };

  const handleTreat = async () => {
    if (!selectedCol) return;
    setIsSubmitting(true);
    try {
      const res = await api.treatOutliers(selectedCol, method, action, threshold);
      setExplanation(res.explanation);
      onRefreshSummary();
      await loadOutliers(selectedCol, method, threshold);
    } catch (e: any) {
      alert(`Outlier treatment failed: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (numCols.length === 0) {
    return <div className="p-12 text-center text-xs text-slate-500">No numerical features found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-purple-600" />
              Outlier Detection & Remediation
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
              IQR Fences & Z-Scores
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect anomalies using statistical thresholds and treat them via Winsorization (clipping) or trimming.
          </p>
        </div>

        {/* Feature Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {numCols.map((c) => (
            <button
              key={c}
              onClick={() => handleSelectCol(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCol === c
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Detection Configuration */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase">Detection Method:</span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleMethodChange('iqr')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                method === 'iqr'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              IQR Fences (1.5 * IQR)
            </button>
            <button
              onClick={() => handleMethodChange('zscore')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                method === 'zscore'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Z-Score Method (|Z| &gt; 3.0)
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Threshold Multiplier: <strong className="font-mono text-slate-800 dark:text-slate-200">{threshold}</strong>
        </div>
      </div>

      {loading || !analysis ? (
        <div className="p-12 text-center text-xs text-slate-500">Calculating outlier bounds...</div>
      ) : (
        <>
          {/* Outlier KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Outliers Detected</span>
              <span className={`text-2xl font-black block mt-1 ${analysis.outliers_count > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {analysis.outliers_count}
              </span>
              <span className="text-[11px] text-slate-500">{analysis.outliers_percentage}% of column rows</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Lower Fence Boundary</span>
              <span className="text-2xl font-black text-indigo-600 block mt-1 font-mono">
                {analysis.lower_bound}
              </span>
              <span className="text-[11px] text-slate-500">Values &lt; lower bound</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Upper Fence Boundary</span>
              <span className="text-2xl font-black text-purple-600 block mt-1 font-mono">
                {analysis.upper_bound}
              </span>
              <span className="text-[11px] text-slate-500">Values &gt; upper bound</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Interquartile Spread</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1 font-mono">
                {analysis.iqr}
              </span>
              <span className="text-[11px] text-slate-500">Q3 ({analysis.q3}) - Q1 ({analysis.q1})</span>
            </div>
          </div>

          {/* Teacher Guidance: Never blindly delete */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Teacher Evaluation Rule: Outliers Must Not Be Blindly Dropped
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {analysis.educational_explanation.validity_note}
            </p>
          </div>

          {/* Sample Outlier Values */}
          {analysis.sample_outlier_values.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                Identified Extreme Outlier Values in '{selectedCol}':
              </span>
              <div className="flex flex-wrap gap-2">
                {analysis.sample_outlier_values.map((v, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-mono font-bold border border-rose-200 dark:border-rose-900/40">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Outlier Treatment Action */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Treat Outliers in '{selectedCol}'
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Treatment Technique
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-medium"
                >
                  <option value="clip">Winsorize / Clip to Fences (Preserves all rows, caps extreme tails)</option>
                  <option value="remove">Trimming / Remove Rows (Drops rows exceeding fences)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleTreat}
              disabled={isSubmitting || analysis.outliers_count === 0}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-40 shadow-xs transition-colors flex items-center gap-2"
            >
              <Scissors className="w-3.5 h-3.5" />
              {isSubmitting ? "Treating..." : `Apply ${action === 'clip' ? 'Winsorization (Clip)' : 'Trimming (Drop)'} to '${selectedCol}'`}
            </button>
          </div>

          {/* Educational Explanation */}
          <ExplanationCard explanation={explanation} />
        </>
      )}
    </div>
  );
};
