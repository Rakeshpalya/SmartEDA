import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, Info, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { TargetAnalysisResponse, DatasetSummary } from '../types';

export const TargetAnalysisPage: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [problemType, setProblemType] = useState<'classification' | 'regression'>('classification');
  const [analysis, setAnalysis] = useState<TargetAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOverview().then((res) => {
      setColumns(res.column_names);
      const defaultTarget = res.column_names.includes('result')
        ? 'result'
        : res.column_names.includes('final_score')
        ? 'final_score'
        : res.column_names[res.column_names.length - 1];

      setSelectedTarget(defaultTarget);
      const isNum = res.column_types[defaultTarget] === 'Numerical';
      const initialType = isNum ? 'regression' : 'classification';
      setProblemType(initialType);
      loadAnalysis(defaultTarget, initialType);
    });
  }, []);

  const loadAnalysis = async (col: string, pType: 'classification' | 'regression') => {
    setLoading(true);
    try {
      const res = await api.getTargetAnalysis(col, pType);
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetChange = (col: string) => {
    setSelectedTarget(col);
    loadAnalysis(col, problemType);
  };

  const handleProblemTypeChange = (pType: 'classification' | 'regression') => {
    setProblemType(pType);
    loadAnalysis(selectedTarget, pType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-rose-600" />
              Target Feature & Class Balance Analysis
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
              Supervised Target Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit the response variable to catch severe class imbalances or target skewness before training models.
          </p>
        </div>

        {/* Configuration Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedTarget}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-slate-900 dark:text-white"
          >
            {columns.map((c) => (
              <option key={c} value={c}>
                Target: {c}
              </option>
            ))}
          </select>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleProblemTypeChange('classification')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                problemType === 'classification'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Classification
            </button>
            <button
              onClick={() => handleProblemTypeChange('regression')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                problemType === 'regression'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Regression
            </button>
          </div>
        </div>
      </div>

      {loading || !analysis ? (
        <div className="p-12 text-center text-xs text-slate-500">Auditing target distribution...</div>
      ) : (
        <>
          {/* Imbalance Warning Banner if detected */}
          {analysis.is_imbalanced && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Class Imbalance Flagged in Target '{selectedTarget}'
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                  {analysis.warning}
                </p>
              </div>
            </div>
          )}

          {/* Classification Target Breakdown */}
          {analysis.problem_type === 'classification' && analysis.distribution && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                  Class Frequency Distribution
                </h3>
                <div className="space-y-3">
                  {analysis.distribution.map((cls) => (
                    <div key={cls.class} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="font-mono text-slate-900 dark:text-white font-bold">{cls.class}</span>
                        <span className="text-indigo-600 font-bold">{cls.count} samples ({cls.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${cls.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Class Distribution Bar Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                  Visual Class Balance Chart
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.distribution} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Class Count" fill="#ec4899" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Regression Continuous Distribution */}
          {analysis.problem_type === 'regression' && analysis.stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Mean Target</span>
                  <span className="text-2xl font-black text-rose-600 block mt-1">{analysis.stats.mean}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Median Target</span>
                  <span className="text-2xl font-black text-purple-600 block mt-1">{analysis.stats.median}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Std Deviation</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200 block mt-1">{analysis.stats.std}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Target Skewness</span>
                  <span className="text-2xl font-black text-amber-600 block mt-1">{analysis.stats.skewness}</span>
                </div>
              </div>

              {/* Histogram */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                  Continuous Target Histogram
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.stats.histogram} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="bin_label" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Frequency" fill="#ec4899" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
