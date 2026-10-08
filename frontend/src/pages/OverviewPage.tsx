import React from 'react';
import {
  FileText, Columns, Rows, HelpCircle, CopyX, Activity,
  Database, ShieldCheck, ArrowRight, AlertTriangle
} from 'lucide-react';
import { DatasetSummary } from '../types';
import { MetricCard } from '../components/MetricCard';
import { HealthScoreCard } from '../components/HealthScoreCard';

interface OverviewPageProps {
  summary: DatasetSummary;
  onNavigate: (tab: any) => void;
  onUploadFile?: (file: File) => void;
  onResetDemo?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ summary, onNavigate, onUploadFile, onResetDemo }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadFile) {
      onUploadFile(file);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv,.xlsx,.xls"
        className="hidden"
      />

      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Active Project Environment
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
              {summary.filename}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-2xl leading-relaxed">
              Exploratory analysis overview, data quality scoring, and automated dimensional health diagnosis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onUploadFile && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                title="Upload custom dataset"
              >
                + Upload New Dataset
              </button>
            )}
            {onResetDemo && (
              <button
                onClick={() => {
                  if (window.confirm("Reset dataset to the built-in Student Performance demo?")) {
                    onResetDemo();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/20 transition-colors"
                title="Reset to Student Performance demo"
              >
                Reset to Demo
              </button>
            )}
            <button
              onClick={() => onNavigate('raw_data')}
              className="px-4 py-2 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 shadow-xs transition-colors flex items-center gap-1.5"
            >
              Explore Raw Data <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('missing')}
              className="px-4 py-2 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white text-xs font-bold border border-indigo-500/50 transition-colors"
            >
              Start Cleaning
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Health Score Card */}
      <HealthScoreCard
        score={summary.data_quality_score}
        grade={summary.data_quality_grade}
        breakdown={summary.data_quality_breakdown}
        onNavigateToSection={(s) => onNavigate(s)}
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <MetricCard
          title="Total Rows"
          value={summary.rows}
          subtitle={`Raw: ${summary.raw_rows}`}
          icon={Rows}
          colorScheme="blue"
          onClick={() => onNavigate('raw_data')}
        />
        <MetricCard
          title="Features (Cols)"
          value={summary.columns}
          subtitle={`${summary.numeric_columns_count} num, ${summary.categorical_columns_count} cat`}
          icon={Columns}
          colorScheme="indigo"
          onClick={() => onNavigate('inspection')}
        />
        <MetricCard
          title="Missing Cells"
          value={summary.missing_values_count}
          subtitle={`${summary.missing_percentage}% of total`}
          icon={HelpCircle}
          colorScheme={summary.missing_values_count > 0 ? "rose" : "emerald"}
          badge={summary.missing_values_count > 0 ? "Action Needed" : "Clean"}
          onClick={() => onNavigate('missing')}
        />
        <MetricCard
          title="Duplicate Rows"
          value={summary.duplicate_rows_count}
          subtitle={`${summary.duplicate_percentage}% rate`}
          icon={CopyX}
          colorScheme={summary.duplicate_rows_count > 0 ? "amber" : "emerald"}
          badge={summary.duplicate_rows_count > 0 ? "Deduplicate" : "Clean"}
          onClick={() => onNavigate('duplicates')}
        />
        <MetricCard
          title="Potential Outliers"
          value={summary.total_outliers_detected}
          subtitle="IQR 1.5 fence"
          icon={Activity}
          colorScheme="purple"
          onClick={() => onNavigate('outliers')}
        />
        <MetricCard
          title="Memory Footprint"
          value={`${summary.memory_usage_mb} MB`}
          subtitle="In-Memory RAM"
          icon={Database}
          colorScheme="slate"
        />
      </div>

      {/* Warning Banners if Constant or Inconsistent Columns exist */}
      {summary.constant_columns && summary.constant_columns.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
              Zero Variance / Constant Columns Detected
            </h4>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
              Column(s) <code className="font-mono font-bold">{summary.constant_columns.join(', ')}</code> have no variance (identical values across all rows). They provide zero predictive power and should be dropped during column cleaning.
            </p>
          </div>
        </div>
      )}

      {/* Workflow Phase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => onNavigate('missing')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            1. Clean Missing & Duplicates
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Execute mean/median/mode imputation, listwise deletion, and duplicate removal with full before/after explanations.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3">
            Open Cleaning Studio →
          </span>
        </div>

        <div
          onClick={() => onNavigate('numerical')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
            <Activity className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            2. Statistical Analysis & Outliers
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Examine five-number summaries, skewness, kurtosis, and apply IQR Winsorization/clipping.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3">
            Open Stats & Charts →
          </span>
        </div>

        <div
          onClick={() => onNavigate('ml')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
            3. Train & Evaluate ML Models
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Fit Random Forest, Gradient Boosting, and Linear/Logistic models with zero data leakage.
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-3">
            Open ML Engine →
          </span>
        </div>
      </div>
    </div>
  );
};
