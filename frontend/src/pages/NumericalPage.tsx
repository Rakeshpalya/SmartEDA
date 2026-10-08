import React, { useState, useEffect } from 'react';
import { BarChart2, Activity, Info, RefreshCw, Calculator } from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { NumericalAnalysisResponse, DatasetSummary } from '../types';

export const NumericalPage: React.FC = () => {
  const [numCols, setNumCols] = useState<string[]>([]);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [analysis, setAnalysis] = useState<NumericalAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverview().then((res) => {
      const nums = Object.entries(res.column_types)
        .filter(([_, t]) => t === 'Numerical')
        .map(([c]) => c);
      setNumCols(nums);
      if (nums.length > 0) {
        setSelectedCol(nums[0]);
        loadColAnalysis(nums[0]);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loadColAnalysis = async (col: string) => {
    setLoading(true);
    try {
      const res = await api.getNumericalAnalysis(col);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCol = (col: string) => {
    setSelectedCol(col);
    loadColAnalysis(col);
  };

  if (numCols.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        No numerical features detected in the dataset.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-600" />
              Numerical Feature & Distribution Analysis
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              Descriptive Statistics & Skewness
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluate central tendency, spread, distribution histograms, Tukey quartiles, and skewness coefficients.
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
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading || !analysis ? (
        <div className="p-12 text-center text-xs text-slate-500">Computing continuous distributions...</div>
      ) : (
        <>
          {/* Key Descriptive Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Arithmetic Mean</span>
              <span className="text-2xl font-black text-indigo-600 block mt-1">{analysis.mean}</span>
              <span className="text-[11px] text-slate-500">Sample average</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Median (Q2)</span>
              <span className="text-2xl font-black text-purple-600 block mt-1">{analysis.median}</span>
              <span className="text-[11px] text-slate-500">50th percentile</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Mode</span>
              <span className="text-2xl font-black text-blue-600 block mt-1">{analysis.mode}</span>
              <span className="text-[11px] text-slate-500">Most frequent value</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Standard Deviation</span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">{analysis.std}</span>
              <span className="text-[11px] text-slate-500">Var: {analysis.variance}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Interquartile Range</span>
              <span className="text-2xl font-black text-amber-600 block mt-1">{analysis.iqr}</span>
              <span className="text-[11px] text-slate-500">Q3 ({analysis.q3}) - Q1 ({analysis.q1})</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Range (Min - Max)</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">{analysis.range}</span>
              <span className="text-[11px] text-slate-500">[{analysis.min} to {analysis.max}]</span>
            </div>
          </div>

          {/* Skewness Explanation Banner */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900/40 text-xs">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-indigo-950 dark:text-indigo-200">
              <Info className="w-4 h-4 text-indigo-600" />
              Automated Skewness Diagnosis ({analysis.skewness > 0.5 ? "Right-Skewed" : analysis.skewness < -0.5 ? "Left-Skewed" : "Symmetric"})
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {analysis.skewness_explanation}
            </p>
          </div>

          {/* Visual Histogram Chart */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Distribution Histogram (10 Bins)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.histogram} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="bin_label" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Frequency" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Five-Number Summary & Box Plot Breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Five-Number Summary (Tukey Box Plot Metrics)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Minimum</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">{analysis.box_plot.min}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Q1 (25th Percentile)</span>
                <span className="text-lg font-black font-mono text-indigo-600 mt-1 block">{analysis.box_plot.q1}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Median (50th Percentile)</span>
                <span className="text-lg font-black font-mono text-purple-600 mt-1 block">{analysis.box_plot.median}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Q3 (75th Percentile)</span>
                <span className="text-lg font-black font-mono text-indigo-600 mt-1 block">{analysis.box_plot.q3}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Maximum</span>
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1 block">{analysis.box_plot.max}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span>Lower IQR Fence: <strong className="font-mono text-slate-800 dark:text-slate-200">{analysis.box_plot.lower_bound}</strong></span>
              <span>Upper IQR Fence: <strong className="font-mono text-slate-800 dark:text-slate-200">{analysis.box_plot.upper_bound}</strong></span>
              <span>Outliers Beyond Fences: <strong className="font-mono text-rose-600">{analysis.box_plot.outliers_count}</strong></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
