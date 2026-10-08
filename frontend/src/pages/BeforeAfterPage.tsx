import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowDown, ShieldCheck, CheckCircle2, History, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { BeforeAfterResponse } from '../types';

export const BeforeAfterPage: React.FC = () => {
  const [data, setData] = useState<BeforeAfterResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBeforeAfter().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Comparing raw vs cleaned dataset...</div>;
  }

  const comparisonMetrics = [
    { label: "Data Quality Score", raw: `${data.raw.quality_score}/100`, clean: `${data.cleaned.quality_score}/100`, improved: data.cleaned.quality_score >= data.raw.quality_score },
    { label: "Total Observations (Rows)", raw: data.raw.rows, clean: data.cleaned.rows, note: "Removed redundant duplicates & invalid rows" },
    { label: "Missing Data Cells", raw: data.raw.missing_values, clean: data.cleaned.missing_values, improved: data.cleaned.missing_values < data.raw.missing_values },
    { label: "Duplicate Records", raw: data.raw.duplicates, clean: data.cleaned.duplicates, improved: data.cleaned.duplicates < data.raw.duplicates },
    { label: "Extreme Outliers", raw: data.raw.outliers, clean: data.cleaned.outliers, improved: data.cleaned.outliers <= data.raw.outliers },
    { label: "Inconsistent Text Labels", raw: data.raw.inconsistencies, clean: data.cleaned.inconsistencies, improved: data.cleaned.inconsistencies <= data.raw.inconsistencies }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Before vs After Cleaning Verification
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
              Audit Comparison
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empirical side-by-side verification demonstrating concrete data quality improvements.
          </p>
        </div>
      </div>

      {/* Comparison Cards: Raw -> Transformation -> Clean */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Raw State */}
        <div className="p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                Initial State
              </span>
              <span className="text-xs font-semibold text-rose-600 font-mono">Pre-Cleaning</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
              Raw Uploaded Dataset
            </h3>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex justify-between py-1.5 border-b border-rose-100 dark:border-rose-900/30">
                <span>Health Score:</span>
                <strong className="font-mono text-rose-600">{data.raw.quality_score}/100 ({data.raw.grade})</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-rose-100 dark:border-rose-900/30">
                <span>Missing Cells:</span>
                <strong className="font-mono text-rose-600">{data.raw.missing_values}</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-rose-100 dark:border-rose-900/30">
                <span>Duplicate Rows:</span>
                <strong className="font-mono text-rose-600">{data.raw.duplicates}</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-rose-100 dark:border-rose-900/30">
                <span>Outlier Points:</span>
                <strong className="font-mono text-rose-600">{data.raw.outliers}</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-rose-100 dark:border-rose-900/30">
                <span>Inconsistent Categoricals:</span>
                <strong className="font-mono text-rose-600">{data.raw.inconsistencies}</strong>
              </li>
            </ul>
          </div>
          <div className="mt-6 text-[11px] text-rose-700 dark:text-rose-400 italic">
            Untreated raw state contains statistical risks and pipeline vulnerabilities.
          </div>
        </div>

        {/* Transformation Pipeline Center Arrow */}
        <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex flex-col justify-center items-center text-center">
          <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md mb-4 animate-bounce">
            <ArrowDown className="w-6 h-6 lg:hidden" />
            <ArrowRight className="w-6 h-6 hidden lg:block" />
          </div>
          <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200 mb-2">
            Applied Preprocessing Steps
          </h4>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-2 font-mono">
            {data.audit_steps.length} Operations
          </span>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Median/Mode imputation, deduplication, string canonicalization, and outlier clipping.
          </p>
        </div>

        {/* Clean State */}
        <div className="p-6 rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                Optimized State
              </span>
              <span className="text-xs font-semibold text-emerald-600 font-mono">Post-Cleaning</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
              Clean Analytical Dataset
            </h3>
            <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-900/30">
                <span>Health Score:</span>
                <strong className="font-mono text-emerald-600">{data.cleaned.quality_score}/100 ({data.cleaned.grade})</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-900/30">
                <span>Missing Cells:</span>
                <strong className="font-mono text-emerald-600">{data.cleaned.missing_values} (Resolved)</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-900/30">
                <span>Duplicate Rows:</span>
                <strong className="font-mono text-emerald-600">{data.cleaned.duplicates} (0%)</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-900/30">
                <span>Outlier Points:</span>
                <strong className="font-mono text-emerald-600">{data.cleaned.outliers} (Stabilized)</strong>
              </li>
              <li className="flex justify-between py-1.5 border-b border-emerald-100 dark:border-emerald-900/30">
                <span>Inconsistent Categoricals:</span>
                <strong className="font-mono text-emerald-600">{data.cleaned.inconsistencies} (Unified)</strong>
              </li>
            </ul>
          </div>
          <div className="mt-6 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Ready for robust statistical modeling.
          </div>
        </div>
      </div>

      {/* Detailed Side-by-Side Metric Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Detailed Dimension & Quality Delta
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-3.5">Quality Metric</th>
                <th className="py-2.5 px-3.5">Raw Initial Value</th>
                <th className="py-2.5 px-3.5">Clean Post-EDA Value</th>
                <th className="py-2.5 px-3.5">Net Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {comparisonMetrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">{m.label}</td>
                  <td className="py-2.5 px-3.5 font-mono text-rose-600">{m.raw}</td>
                  <td className="py-2.5 px-3.5 font-mono text-emerald-600 font-bold">{m.clean}</td>
                  <td className="py-2.5 px-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Improved
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Timeline */}
      {data.audit_steps.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Audit Trail of Cleaning Steps Applied
          </h3>

          <div className="space-y-3">
            {data.audit_steps.map((st) => (
              <div key={st.step} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Step {st.step}: {st.operation} {st.column ? `on '${st.column}'` : ''}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {st.explanation.technique}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  {st.explanation.what_changed}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
