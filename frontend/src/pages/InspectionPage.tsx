import React, { useState, useEffect } from 'react';
import { Search, Rows, Columns, Database, Info, Calculator, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { InspectionResponse } from '../types';

export const InspectionPage: React.FC = () => {
  const [data, setData] = useState<InspectionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInspection().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading inspection metrics...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            Data Inspection & Schema Diagnosis
          </h2>
          <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
            df.info() & df.describe()
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed structural audit covering shapes, memory footprints, non-null counts, and statistical parameters.
        </p>
      </div>

      {/* SECTION 1: Dataset Shape & Dimensionality */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Rows className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            1. Dataset Shape (df.shape)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Rows (Observations)</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">{data.shape.rows}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Individual sample records</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Columns (Features)</span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5 block">{data.shape.columns}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Independent & dependent variables</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Matrix Dimensionality</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{data.shape.rows * data.shape.columns}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Total grid data points</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Dimensional Ratio</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">{(data.shape.rows / Math.max(data.shape.columns, 1)).toFixed(1)} : 1</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Rows per feature ratio</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: Column Information (df.info()) Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
              <Database className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              2. Column Information & Schema (df.info())
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {data.columns.length} columns analyzed
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3.5">Column</th>
                <th className="py-2.5 px-3.5">Storage Dtype</th>
                <th className="py-2.5 px-3.5">Detected Role</th>
                <th className="py-2.5 px-3.5">Non-Null Count</th>
                <th className="py-2.5 px-3.5">Missing Count (%)</th>
                <th className="py-2.5 px-3.5">Unique Count</th>
                <th className="py-2.5 px-3.5">Sample Values</th>
                <th className="py-2.5 px-3.5">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.columns.map((col) => (
                <tr key={col.column} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white font-mono">
                    {col.column}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-500">
                    {col.dtype}
                  </td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {col.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-slate-700 dark:text-slate-300">
                    {col.non_null_count}
                  </td>
                  <td className="py-2.5 px-3.5">
                    {col.missing_count > 0 ? (
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {col.missing_count} ({col.missing_pct}%)
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">0 (0%)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-slate-700 dark:text-slate-300">
                    {col.unique_count}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-400 text-[11px] font-mono">
                    {col.samples.join(', ')}
                  </td>
                  <td className="py-2.5 px-3.5 text-indigo-600 dark:text-indigo-400 font-medium text-[11px]">
                    {col.recommended_action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Statistical Summary (df.describe()) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Calculator className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              3. Numerical Summary Statistics (df.describe())
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {data.numeric_summary.length} numerical features
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3.5">Feature</th>
                <th className="py-2.5 px-3.5">Count</th>
                <th className="py-2.5 px-3.5">Mean</th>
                <th className="py-2.5 px-3.5">Median (Q2)</th>
                <th className="py-2.5 px-3.5">Std Dev</th>
                <th className="py-2.5 px-3.5">Variance</th>
                <th className="py-2.5 px-3.5">Min</th>
                <th className="py-2.5 px-3.5">25% (Q1)</th>
                <th className="py-2.5 px-3.5">75% (Q3)</th>
                <th className="py-2.5 px-3.5">Max</th>
                <th className="py-2.5 px-3.5">IQR</th>
                <th className="py-2.5 px-3.5">Skewness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {data.numeric_summary.map((num) => (
                <tr key={num.column} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3.5 font-bold font-sans text-slate-900 dark:text-white">
                    {num.column}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.count}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-indigo-600 dark:text-indigo-400">{num.mean}</td>
                  <td className="py-2.5 px-3.5 font-semibold text-purple-600 dark:text-purple-400">{num.median}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.std}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.variance}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.min}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.q1}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.q3}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.max}</td>
                  <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{num.iqr}</td>
                  <td className="py-2.5 px-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                      Math.abs(num.skewness) > 0.5 ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    }`}>
                      {num.skewness} ({num.skewness_type})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Metric Explanation Legend for Teachers */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-indigo-500" />
            Educational Metric Explanations for Evaluation
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-600 dark:text-slate-400 mt-2">
            <div><strong>Mean:</strong> Arithmetic average, sensitive to extreme outliers.</div>
            <div><strong>Median:</strong> 50th percentile, robust central tendency for skewed data.</div>
            <div><strong>Std Dev:</strong> Degree of dispersion/spread around the sample mean.</div>
            <div><strong>IQR:</strong> Middle 50% spread (Q3 - Q1), core anchor of Tukey outlier fences.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
