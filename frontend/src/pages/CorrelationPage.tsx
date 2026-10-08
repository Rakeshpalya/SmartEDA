import React, { useState, useEffect } from 'react';
import { GitCompare, AlertTriangle, Info, RefreshCw, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import { CorrelationResponse } from '../types';

export const CorrelationPage: React.FC = () => {
  const [method, setMethod] = useState<'pearson' | 'spearman'>('pearson');
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCorrelation = async (m = method) => {
    setLoading(true);
    try {
      const res = await api.getCorrelation(m);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelation();
  }, [method]);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Computing correlation matrix...</div>;
  }

  const getHeatmapColor = (val: number) => {
    if (val === 1) return 'bg-indigo-600 text-white font-bold';
    if (val >= 0.7) return 'bg-indigo-500 text-white font-bold';
    if (val >= 0.4) return 'bg-indigo-300 dark:bg-indigo-900/80 text-indigo-950 dark:text-indigo-100 font-semibold';
    if (val > 0.1) return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200';
    if (val >= -0.1) return 'bg-slate-100 dark:bg-slate-800 text-slate-500';
    if (val >= -0.4) return 'bg-rose-100 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
    if (val >= -0.7) return 'bg-rose-300 dark:bg-rose-900/80 text-rose-950 dark:text-rose-100 font-semibold';
    return 'bg-rose-600 text-white font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-indigo-600" />
              Bivariate Correlation Analysis
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              {method.toUpperCase()} Matrix
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate linear co-movement (Pearson) and monotonic rank relationships (Spearman).
          </p>
        </div>

        {/* Method Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setMethod('pearson')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              method === 'pearson'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pearson (Linear)
          </button>
          <button
            onClick={() => setMethod('spearman')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              method === 'spearman'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Spearman (Rank Monotonic)
          </button>
        </div>
      </div>

      {/* Golden Rule Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
            Golden Statistical Axiom: Correlation Does Not Imply Causation
          </h4>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
            {data.educational_note}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Strong Positive</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-indigo-600 block mt-1">{data.strong_positive_count}</span>
          <span className="text-[11px] text-slate-500">Pairs with r &ge; +0.50</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Strong Negative</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-black text-rose-600 block mt-1">{data.strong_negative_count}</span>
          <span className="text-[11px] text-slate-500">Pairs with r &le; -0.50</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Weak / Independent</span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-300 block mt-1">{data.weak_count}</span>
          <span className="text-[11px] text-slate-500">Pairs with |r| &lt; 0.20</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase">Numerical Grid Size</span>
          <span className="text-2xl font-black text-purple-600 block mt-1">{data.columns.length} &times; {data.columns.length}</span>
          <span className="text-[11px] text-slate-500">Continuous features</span>
        </div>
      </div>

      {/* Dynamic Key Correlation Insight */}
      {data.top_pair_insight && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
          <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium">
            <strong>Key Correlation Discovery: </strong>
            {data.top_pair_insight}
          </p>
        </div>
      )}

      {/* Interactive Correlation Heatmap Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Color-Encoded Correlation Heatmap Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-semibold text-slate-500"></th>
                {data.columns.map((c) => (
                  <th key={c} className="p-2 font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row) => (
                <tr key={row.column}>
                  <td className="p-2 text-left font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {row.column}
                  </td>
                  {data.columns.map((col) => {
                    const val = Number(row[col]);
                    return (
                      <td key={col} className="p-1">
                        <div
                          className={`w-14 h-10 mx-auto flex items-center justify-center rounded-lg font-mono text-xs transition-transform hover:scale-110 ${getHeatmapColor(
                            val
                          )}`}
                          title={`${row.column} & ${col}: r = ${val}`}
                        >
                          {val.toFixed(2)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Correlated Feature Pairs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">
          Top Correlated Feature Pairs
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3.5">Feature 1</th>
                <th className="py-2.5 px-3.5">Feature 2</th>
                <th className="py-2.5 px-3.5">Coefficient (r)</th>
                <th className="py-2.5 px-3.5">Relationship Strength</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {data.pairs.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3.5 font-bold font-sans text-slate-800 dark:text-slate-200">{p.col1}</td>
                  <td className="py-2 px-3.5 font-bold font-sans text-slate-800 dark:text-slate-200">{p.col2}</td>
                  <td className="py-2 px-3.5 font-bold text-indigo-600 dark:text-indigo-400">{p.correlation}</td>
                  <td className="py-2 px-3.5 font-sans">
                    {Math.abs(p.correlation) >= 0.7 ? (
                      <span className="text-indigo-600 font-bold">Strong {p.correlation > 0 ? "Positive" : "Negative"}</span>
                    ) : Math.abs(p.correlation) >= 0.4 ? (
                      <span className="text-purple-600 font-medium">Moderate {p.correlation > 0 ? "Positive" : "Negative"}</span>
                    ) : (
                      <span className="text-slate-400">Weak / Negligible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
