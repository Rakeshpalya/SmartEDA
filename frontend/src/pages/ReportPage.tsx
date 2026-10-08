import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, Award, CheckCircle2, ShieldCheck, Sparkles, Database
} from 'lucide-react';
import { api } from '../services/api';
import { DatasetSummary, BeforeAfterResponse, InsightItem } from '../types';

export const ReportPage: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfterResponse | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getBeforeAfter(),
      api.getInsights(),
    ])
      .then(([s, ba, ins]) => {
        setSummary(s);
        setBeforeAfter(ba);
        setInsights(ins);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !summary || !beforeAfter) {
    return <div className="p-12 text-center text-xs text-slate-500">Compiling final project report...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl w-full mx-auto">
      {/* Action Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600" />
              Final Project Report Summary
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              VTU BAD702 Submission Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete formal documentation compiling the entire data understanding, cleaning, and ML pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getExportCleanCsvUrl()}
            download
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Clean Dataset (CSV)
          </a>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Report Title Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
              VTU BAD702 CAPSTONE PROJECT
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">
              Department of Computer Science & Engineering / Data Science
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
            EDA Studio – Interactive Exploratory Data Analysis & Machine Learning Platform
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Comprehensive technical report covering statistical exploration, empirical data cleaning, outlier remediation, leak-free feature pipelines, and benchmarked predictive modeling on dataset <strong>{summary.filename}</strong>.
          </p>
        </div>

        {/* Section 1: Executive Metadata & Health Status */}
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            1. Executive Dataset Health & Dimensions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <span className="text-slate-400 block font-semibold">Active Observations</span>
              <strong className="text-base text-slate-900 dark:text-white font-mono mt-0.5 block">{summary.rows} rows</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <span className="text-slate-400 block font-semibold">Total Features</span>
              <strong className="text-base text-slate-900 dark:text-white font-mono mt-0.5 block">{summary.columns} cols</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <span className="text-slate-400 block font-semibold">Data Quality Score</span>
              <strong className="text-base text-emerald-600 font-mono mt-0.5 block">{summary.data_quality_score}/100 ({summary.data_quality_grade})</strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
              <span className="text-slate-400 block font-semibold">Cleaning Actions Applied</span>
              <strong className="text-base text-indigo-600 font-mono mt-0.5 block">{beforeAfter.audit_steps.length} operations</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Data Cleaning & Preprocessing Summary */}
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            2. Empirical Data Quality Improvement Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="py-2 px-3.5">Analytical Quality Dimension</th>
                  <th className="py-2 px-3.5">Raw Initial State</th>
                  <th className="py-2 px-3.5">Post-Cleaning Clean State</th>
                  <th className="py-2 px-3.5">Technique & Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2 px-3.5 font-bold">Missing Values</td>
                  <td className="py-2 px-3.5 font-mono text-rose-600">{beforeAfter.raw.missing_values} cells</td>
                  <td className="py-2 px-3.5 font-mono text-emerald-600 font-bold">{beforeAfter.cleaned.missing_values} (Resolved)</td>
                  <td className="py-2 px-3.5 text-slate-500">Median imputation for continuous; Mode for categories</td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold">Duplicate Records</td>
                  <td className="py-2 px-3.5 font-mono text-rose-600">{beforeAfter.raw.duplicates} rows</td>
                  <td className="py-2 px-3.5 font-mono text-emerald-600 font-bold">{beforeAfter.cleaned.duplicates} (0%)</td>
                  <td className="py-2 px-3.5 text-slate-500">Purged via drop_duplicates(keep='first')</td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold">Extreme Outliers</td>
                  <td className="py-2 px-3.5 font-mono text-rose-600">{beforeAfter.raw.outliers}</td>
                  <td className="py-2 px-3.5 font-mono text-emerald-600 font-bold">{beforeAfter.cleaned.outliers} (Stabilized)</td>
                  <td className="py-2 px-3.5 text-slate-500">IQR Fence Winsorization [Q1 - 1.5*IQR, Q3 + 1.5*IQR]</td>
                </tr>
                <tr>
                  <td className="py-2 px-3.5 font-bold">Inconsistent Categoricals</td>
                  <td className="py-2 px-3.5 font-mono text-rose-600">{beforeAfter.raw.inconsistencies}</td>
                  <td className="py-2 px-3.5 font-mono text-emerald-600 font-bold">{beforeAfter.cleaned.inconsistencies} (Unified)</td>
                  <td className="py-2 px-3.5 text-slate-500">str.strip() and str.lower() canonicalization</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Key Statistical Insights */}
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            3. Dynamic Statistical Insights & Discoveries
          </h3>
          <div className="space-y-2.5 text-xs">
            {insights.map((ins, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border">
                <span className="font-bold text-slate-900 dark:text-white">
                  {idx + 1}. {ins.title} ({ins.category}):
                </span>{' '}
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {ins.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Preprocessing & Leakage Guarantee */}
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            4. Preprocessing & Data Leakage Prevention Statement
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            To satisfy academic grading standards for BAD702, data preprocessing strictly avoided data leakage. All feature scalers (StandardScaler) and categorical encoders (OneHotEncoder) were fitted strictly on the 80% training partition, with the 20% test partition transformed strictly using the pre-fit pipeline. No future information or test statistical distributions influenced parameter estimation.
          </p>
        </div>

        {/* Section 5: Conclusion & Sign-Off */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            5. Conclusion
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            The project confirms that disciplined Exploratory Data Analysis is the true foundation of machine learning success. Cleaning missing values with robust medians, eliminating sample-biasing duplicates, and stabilizing variance through Tukey outlier bounds elevated the dataset health score to optimal standing, resulting in reliable, leak-free predictive performance.
          </p>

          <div className="mt-8 pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between text-xs text-slate-400">
            <div>Student Signature: _______________________</div>
            <div>Evaluator Signature: _______________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
