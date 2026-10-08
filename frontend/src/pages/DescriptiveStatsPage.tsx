import React, { useState, useEffect } from 'react';
import { Calculator, Info, RefreshCw, BarChart2 } from 'lucide-react';
import { api } from '../services/api';
import { NumericalAnalysisResponse } from '../types';

export const DescriptiveStatsPage: React.FC = () => {
  const [numCols, setNumCols] = useState<string[]>([]);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [stats, setStats] = useState<NumericalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverview().then((res) => {
      const nums = Object.entries(res.column_types)
        .filter(([_, t]) => t === 'Numerical')
        .map(([c]) => c);
      setNumCols(nums);
      if (nums.length > 0) {
        setSelectedCol(nums[0]);
        loadStats(nums[0]);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadStats = async (col: string) => {
    setLoading(true);
    try {
      const res = await api.getNumericalAnalysis(col);
      setStats(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCol = (col: string) => {
    setSelectedCol(col);
    loadStats(col);
  };

  if (numCols.length === 0) {
    return <div className="p-12 text-center text-xs text-slate-500">No continuous numerical features found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-indigo-600" />
              Descriptive Statistics & Moment Analysis
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              Moments & Quartiles
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compute sample mean, variance, higher moments (skewness, kurtosis), and five-number percentiles.
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
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading || !stats ? (
        <div className="p-12 text-center text-xs text-slate-500">Calculating statistical metrics...</div>
      ) : (
        <>
          {/* Automated Interpretation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900/40 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200 mb-1">
              <Info className="w-4 h-4 text-indigo-600" />
              Mathematical Moment & Symmetry Interpretation for '{selectedCol}'
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {stats.mean > stats.median
                ? `Median (${stats.median}) is lower than the arithmetic mean (${stats.mean}), confirming positive right-skewness (skewness = ${stats.skewness}). This indicates that a smaller subset of high-value observations pulls the right tail.`
                : stats.mean < stats.median
                ? `Median (${stats.median}) exceeds the arithmetic mean (${stats.mean}), indicating negative left-skewness (skewness = ${stats.skewness}). The left tail is elongated by lower observations.`
                : `Mean (${stats.mean}) and Median (${stats.median}) are approximately identical, representing a symmetrical, bell-shaped Gaussian distribution.`}
            </p>
          </div>

          {/* Grid of All Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Arithmetic Mean</span>
              <span className="text-2xl font-black text-indigo-600 block mt-1">{stats.mean}</span>
              <span className="text-[10px] text-slate-500">&Sigma;x / N</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Median (Q2)</span>
              <span className="text-2xl font-black text-purple-600 block mt-1">{stats.median}</span>
              <span className="text-[10px] text-slate-500">50th percentile rank</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Mode</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">{stats.mode}</span>
              <span className="text-[10px] text-slate-500">Most frequent value</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Standard Deviation (&sigma;)</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">{stats.std}</span>
              <span className="text-[10px] text-slate-500">&radic;Variance</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Variance (&sigma;&sup2;)</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">{stats.variance}</span>
              <span className="text-[10px] text-slate-500">Second central moment</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Fisher Skewness</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{stats.skewness}</span>
              <span className="text-[10px] text-slate-500">Third standardized moment</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Kurtosis</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">{stats.kurtosis}</span>
              <span className="text-[10px] text-slate-500">Fourth moment (tail weight)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">IQR (Interquartile Range)</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">{stats.iqr}</span>
              <span className="text-[10px] text-slate-500">Q3 - Q1 Spread</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
