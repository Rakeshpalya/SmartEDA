import React, { useState, useEffect } from 'react';
import { Layers, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { RawTableResponse } from '../types';
import { InteractiveChartBuilder } from '../components/InteractiveChartBuilder';

export const VisualizationStudioPage: React.FC = () => {
  const [data, setData] = useState<RawTableResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getRawTable({ page: 1, pageSize: 100, useRaw: false });
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading visualization engine...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Interactive Visualization Studio
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              Custom Chart Builder
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build histograms, box plots, scatter plots, donut charts, and line charts dynamically across any feature.
          </p>
        </div>

        <button
          onClick={fetchRecords}
          className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <InteractiveChartBuilder columns={data.columns} records={data.records} />
    </div>
  );
};
