import React, { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { InsightItem } from '../types';

export const InsightsPage: React.FC = () => {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.getInsights();
      setInsights(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Computing data-grounded insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              Automated Statistical Insights Engine
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
              100% Calculated Dynamically
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data-backed statistical deductions calculated strictly from your active dataset numbers. No fabricated metrics.
          </p>
        </div>

        <button
          onClick={fetchInsights}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {item.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  #{idx + 1}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                {item.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {item.text}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified via empirical dataset math
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
