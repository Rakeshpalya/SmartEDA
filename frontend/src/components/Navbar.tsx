import React, { useRef } from 'react';
import {
  Sparkles, RotateCcw, Presentation, Sun, Moon,
  FileSpreadsheet, ShieldAlert, ShieldCheck, Upload, Database
} from 'lucide-react';
import { DatasetSummary } from '../types';

interface NavbarProps {
  summary: DatasetSummary | null;
  onResetRaw: () => void;
  onResetDemo: () => void;
  onUploadFile: (file: File) => void;
  onOpenPresentation: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  summary,
  onResetRaw,
  onResetDemo,
  onUploadFile,
  onOpenPresentation,
  darkMode,
  onToggleDarkMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
      if (e.target) e.target.value = '';
    }
  };

  const handleResetDemoClick = () => {
    if (window.confirm("Reset dataset to the built-in Student Performance demo? Any current uploaded data or cleaning steps will be reset.")) {
      onResetDemo();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                EDA Studio
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                VTU BAD702
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Exploratory Data Analysis & ML Platform
            </p>
          </div>
        </div>

        {/* Dataset Status Pill */}
        {summary && (
          <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-white font-mono truncate max-w-[160px]" title={summary.filename}>
              {summary.filename}
            </span>
            <span className="text-slate-400">•</span>
            <span>{summary.rows} rows</span>
            <span className="text-slate-400">•</span>
            <span>{summary.columns} cols</span>

            <div className="ml-1 pl-2 border-l border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              {summary.data_quality_score >= 80 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="font-bold text-slate-900 dark:text-white">
                {summary.data_quality_score}/100
              </span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Hidden File Picker */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          {/* Upload New Dataset Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
            title="Upload CSV or Excel dataset"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Upload New Dataset</span>
          </button>

          {/* Reset to Demo Dataset Button */}
          <button
            onClick={handleResetDemoClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reset dataset to the built-in Student Performance demo"
          >
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden md:inline">Reset to Demo</span>
          </button>

          {/* Revert Cleaning to Raw */}
          <button
            onClick={onResetRaw}
            className="p-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Revert cleaning changes back to raw upload"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Presentation Mode Button */}
          <button
            onClick={onOpenPresentation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xs transition-all"
            title="Start 10-minute Viva Presentation Mode"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Presentation Mode</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
