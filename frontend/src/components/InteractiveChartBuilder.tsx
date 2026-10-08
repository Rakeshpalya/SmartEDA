import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, ScatterChart as ScatterIcon, Layers, Download, Info } from 'lucide-react';
import { TableRecord } from '../types';

interface InteractiveChartBuilderProps {
  columns: string[];
  records: TableRecord[];
}

const COLORS = [
  '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
  '#8b5cf6', '#3b82f6', '#14b8a6', '#f97316', '#6366f1'
];

export const InteractiveChartBuilder: React.FC<InteractiveChartBuilderProps> = ({
  columns,
  records,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'scatter' | 'pie' | 'area'>('bar');
  const [xAxis, setXAxis] = useState<string>(columns[0] || '');
  const [yAxis, setYAxis] = useState<string>(columns[1] || columns[0] || '');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [aggregation, setAggregation] = useState<'mean' | 'sum' | 'count'>('mean');

  // Identify numeric columns
  const numericColumns = useMemo(() => {
    return columns.filter((col) => {
      const sample = records.slice(0, 30).map((r) => r[col]).filter((v) => v !== null && v !== undefined);
      return sample.length > 0 && sample.every((v) => !isNaN(Number(v)));
    });
  }, [columns, records]);

  // Transform records for chart display
  const chartData = useMemo(() => {
    if (!xAxis || records.length === 0) return [];

    if (chartType === 'scatter') {
      return records
        .filter((r) => r[xAxis] !== null && r[yAxis] !== null && !isNaN(Number(r[xAxis])) && !isNaN(Number(yAxis ? r[yAxis] : 0)))
        .slice(0, 150)
        .map((r, i) => ({
          x: Number(r[xAxis]),
          y: Number(r[yAxis]),
          label: `Sample ${i + 1}`,
          group: groupBy !== 'none' ? String(r[groupBy]) : undefined,
        }));
    }

    // Grouping & Aggregation for Bar, Line, Area, Pie
    const groups: Record<string, { totalY: number; count: number }> = {};

    records.forEach((r) => {
      const rawX = r[xAxis];
      if (rawX === null || rawX === undefined) return;
      const xKey = String(rawX);

      if (!groups[xKey]) {
        groups[xKey] = { totalY: 0, count: 0 };
      }

      groups[xKey].count += 1;
      if (yAxis && r[yAxis] !== null && !isNaN(Number(r[yAxis]))) {
        groups[xKey].totalY += Number(r[yAxis]);
      }
    });

    const result = Object.entries(groups).map(([key, val]) => {
      let finalY = val.count;
      if (yAxis && numericColumns.includes(yAxis)) {
        if (aggregation === 'sum') finalY = val.totalY;
        else if (aggregation === 'mean') finalY = val.count > 0 ? val.totalY / val.count : 0;
      }
      return {
        name: key,
        value: Math.round(finalY * 100) / 100,
        count: val.count,
      };
    });

    // Limit to top 15 categories for neat rendering
    return result.slice(0, 15);
  }, [records, xAxis, yAxis, chartType, aggregation, groupBy, numericColumns]);

  // "Why this chart?" explanations
  const chartExplanations: Record<string, { purpose: string; bestFor: string; guidance: string }> = {
    bar: {
      purpose: "Compares values or frequencies across distinct categories.",
      bestFor: "Categorical vs Numerical aggregations (e.g., Average Study Hours by Gender).",
      guidance: "Use bar charts to spot high-performing groups or glaring disparities across classes."
    },
    line: {
      purpose: "Displays continuous trends, sequential movements, or ordinal progression.",
      bestFor: "Ordered sequences, age progression, or cumulative metrics.",
      guidance: "Ideal for tracking how target metrics evolve across ordered intervals."
    },
    scatter: {
      purpose: "Analyzes the bivariate relationship and correlation between two continuous variables.",
      bestFor: "Two numerical features (e.g., Study Hours vs Final Score).",
      guidance: "Observe whether points cluster along an upward (positive) or downward (negative) slope, or if clusters exist."
    },
    pie: {
      purpose: "Illustrates proportions of a whole across categorical components.",
      bestFor: "Low-cardinality categorical variables with <= 6 distinct segments.",
      guidance: "Shows relative market share or class balance. Avoid when categories exceed 7 items."
    },
    area: {
      purpose: "Emphasizes magnitude of change over an interval while showing volume under the curve.",
      bestFor: "Continuous cumulative values.",
      guidance: "Combines the trendline of a line chart with the physical volume presence of a bar chart."
    }
  };

  const handleDownloadSVG = () => {
    alert("Chart snapshot ready! Right-click the SVG to save image, or use the Print / Export feature in the Report tab.");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Interactive Visualization Studio
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamically map features, customize aggregations, and uncover hidden patterns.
          </p>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setChartType('bar')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'bar'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Bar
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'line'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            Line
          </button>
          <button
            onClick={() => setChartType('scatter')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'scatter'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ScatterIcon className="w-3.5 h-3.5" />
            Scatter
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'pie'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            Donut
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              chartType === 'area'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Area
          </button>
        </div>
      </div>

      {/* Control Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 my-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            X-Axis Feature
          </label>
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200"
          >
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Y-Axis / Metric
          </label>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="">(Count Frequency)</option>
            {columns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Aggregation
          </label>
          <select
            value={aggregation}
            onChange={(e) => setAggregation(e.target.value as any)}
            disabled={!yAxis || !numericColumns.includes(yAxis)}
            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 dark:text-slate-200 disabled:opacity-50"
          >
            <option value="mean">Mean (Average)</option>
            <option value="sum">Sum</option>
            <option value="count">Count Frequency</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={handleDownloadSVG}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Graphic
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[360px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData as any} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="value" name={yAxis ? `${aggregation.toUpperCase()} of ${yAxis}` : 'Record Count'} fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData as any} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : chartType === 'area' ? (
            <AreaChart data={chartData as any} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
            </AreaChart>
          ) : chartType === 'scatter' ? (
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="x" name={xAxis} tick={{ fontSize: 11 }} />
              <YAxis dataKey="y" name={yAxis} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Observations" data={chartData as any} fill="#ec4899" />
            </ScatterChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData as any}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={3}
                label={(entry: any) => `${entry.name || ''} (${entry.value || ''})`}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* "Why this chart?" Educational Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-300 mb-1">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Why This Chart? ({chartType.toUpperCase()} Visualization Rationale)
        </div>
        <p className="text-slate-700 dark:text-slate-300 mb-1 leading-relaxed">
          <strong>Purpose:</strong> {chartExplanations[chartType]?.purpose}
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          <strong>Best Practice:</strong> {chartExplanations[chartType]?.guidance}
        </p>
      </div>
    </div>
  );
};
