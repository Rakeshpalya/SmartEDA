import React, { useState } from 'react';
import {
  UploadCloud, Sparkles, FileSpreadsheet, ArrowRight, CheckCircle2,
  Database, ShieldCheck, Activity, BarChart2, Cpu, FileText, Play
} from 'lucide-react';
import { DatasetSummary } from '../types';

interface LandingPageProps {
  onFileUpload: (file: File) => void;
  onLoadDemo: () => void;
  onEnterDashboard: () => void;
  hasActiveDataset: boolean;
  activeSummary: DatasetSummary | null;
  isLoading: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onFileUpload,
  onLoadDemo,
  onEnterDashboard,
  hasActiveDataset,
  activeSummary,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const workflowSteps = [
    { num: "01", name: "Raw Data", desc: "Upload CSV / XLSX" },
    { num: "02", name: "Inspect", desc: "head, shape & dtypes" },
    { num: "03", name: "Clean", desc: "Missing & duplicates" },
    { num: "04", name: "Analyze", desc: "Stats & outliers" },
    { num: "05", name: "Visualize", desc: "Distributions & heatmaps" },
    { num: "06", name: "Transform", desc: "Encode & scale" },
    { num: "07", name: "Model", desc: "Train algorithms" },
    { num: "08", name: "Evaluate", desc: "Metrics & F1 score" },
    { num: "09", name: "Insights", desc: "Report & Viva Deck" }
  ];

  const whyEdaCards = [
    { title: "1. Understand Your Data", text: "Discover underlying distributions, dimensional scales, and domain anomalies before modeling." },
    { title: "2. Detect Data Quality Issues", text: "Identify hidden missingness, duplicate observations, and inconsistent text labels early." },
    { title: "3. Discover True Patterns", text: "Extract natural clusters, variance spreads, and non-linear associations through rich charts." },
    { title: "4. Identify Relationships", text: "Calculate Pearson and Spearman correlations to spotlight co-dependent predictive drivers." },
    { title: "5. Prepare Better Features", text: "Execute leak-free imputation, one-hot encoding, and numerical scaling transformations." },
    { title: "6. Build Reliable ML Models", text: "Prevent garbage-in-garbage-out. High model accuracy is fundamentally bounded by clean EDA." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Floating Stat Badges */}
        <div className="hidden md:flex justify-between max-w-5xl mx-auto mb-8 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-indigo-600 dark:text-indigo-400 animate-pulse">
            ✨ 1,250 Rows Loaded
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-purple-600 dark:text-purple-400">
            📊 18 Features Analyzed
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            🛡️ 97.4% Data Quality
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-amber-600 dark:text-amber-400">
            🔍 0 Missing Values Post-Cleaning
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            VTU BAD702 • Statistical Machine Learning & Data Science
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-slate-950 dark:text-white mb-4">
            EDA Studio
          </h1>
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Explore. Clean. Visualize. Understand. Predict.
          </p>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An interactive Exploratory Data Analysis & Machine Learning platform that bridges raw, messy real-world data and high-performing predictive models with full mathematical explanations.
          </p>

          {/* Quick Active Dataset Card */}
          {hasActiveDataset && activeSummary && (
            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 max-w-lg mx-auto flex items-center justify-between shadow-sm">
              <div className="text-left">
                <span className="text-[11px] font-bold text-indigo-600 uppercase">Currently Active Dataset</span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[240px]">
                  {activeSummary.filename}
                </h4>
                <span className="text-xs text-slate-500">
                  {activeSummary.rows} rows • {activeSummary.columns} columns • Quality {activeSummary.data_quality_score}/100
                </span>
              </div>
              <button
                onClick={onEnterDashboard}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                Open Studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Upload & Demo Area */}
        <div className="max-w-xl mx-auto">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center transition-all bg-white dark:bg-slate-900 ${
              isDragOver
                ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 scale-[1.01]"
                : "border-slate-300 dark:border-slate-800 hover:border-indigo-400"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Drop your dataset here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Supports CSV, Excel (.xlsx, .xls). Automatic inspection & quality diagnosis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Browse Files
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                onClick={onLoadDemo}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-emerald-500" />
                Explore Demo Dataset
              </button>
            </div>

            <p className="mt-4 text-[11px] text-slate-400">
              Demo contains realistic student records with missing cells, duplicates & outliers for full cleaning demonstration.
            </p>
          </div>
        </div>

        {/* Complete EDA Workflow Horizontal Timeline */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Structured Methodology
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Complete Interactive Workflow
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5 max-w-6xl mx-auto">
            {workflowSteps.map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-2xs hover:border-indigo-300 transition-colors"
              >
                <span className="text-[10px] font-black font-mono text-indigo-600 dark:text-indigo-400 block mb-1">
                  {s.num}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  {s.name}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Why EDA Matters Cards */}
        <div className="mt-20">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Foundation of Data Science
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              Why EDA Matters (Higher Weightage than ML)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {whyEdaCards.map((c, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
        EDA Studio • VTU BAD702 Statistical Machine Learning & Data Science Final Project • Built for College Viva & Production Excellence
      </footer>
    </div>
  );
};
