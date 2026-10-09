import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart as PieIcon, BarChart2, Tag, Info, RefreshCw, Filter, CheckSquare, RotateCcw, Sparkles, Database
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { CategoricalAnalysisResponse, DatasetSummary, OperationExplanation } from '../types';
import { ExplanationCard } from '../components/ExplanationCard';
import { BackendErrorCard } from '../components/BackendErrorCard';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

interface CategoricalPageProps {
  onRefreshSummary?: () => void;
}

export const CategoricalPage: React.FC<CategoricalPageProps> = ({ onRefreshSummary }) => {
  const [, setSummary] = useState<DatasetSummary | null>(null);
  const [catCols, setCatCols] = useState<string[]>([]);
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [useRaw, setUseRaw] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<CategoricalAnalysisResponse | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [explanation, setExplanation] = useState<OperationExplanation | null>(null);
  const [normalizeSuccess, setNormalizeSuccess] = useState(false);

  useEffect(() => {
    api.getOverview().then((res) => {
      setSummary(res);
      const cats = Object.entries(res.column_types)
        .filter(([_, t]) => t === 'Categorical' || t === 'Text' || t === 'Boolean')
        .map(([c]) => c);
      setCatCols(cats);
      if (cats.length > 0) {
        setSelectedCol(cats[0]);
        loadColAnalysis(cats[0], false);
      } else {
        setLoading(false);
      }
    }).catch((e: any) => {
      setError(e.message || "Failed to load overview data from backend.");
      setLoading(false);
    });
  }, []);

  const loadColAnalysis = async (col: string, rawMode: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCategoricalAnalysis(col, rawMode);
      setAnalysis(res);
      // Default state: All Categories selected
      setSelectedCategories(res.distribution.map((d) => d.category));
    } catch (e: any) {
      console.error(e);
      setError(e.message || `Failed to analyze categorical column '${col}'.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCol = (col: string) => {
    setSelectedCol(col);
    setExplanation(null);
    setNormalizeSuccess(false);
    loadColAnalysis(col, useRaw);
  };

  const handleToggleUseRaw = (rawMode: boolean) => {
    setUseRaw(rawMode);
    if (selectedCol) {
      loadColAnalysis(selectedCol, rawMode);
    }
  };

  const handleNormalizeCurrent = async () => {
    if (!selectedCol) return;
    setIsNormalizing(true);
    try {
      const res = await api.treatInconsistencies(selectedCol, 'canonical');
      setExplanation(res.explanation);
      setNormalizeSuccess(true);
      setUseRaw(false); // switch to clean view to see standardized results
      await loadColAnalysis(selectedCol, false);
      if (onRefreshSummary) onRefreshSummary();
    } catch (e: any) {
      alert(`Normalization failed: ${e.message}`);
    } finally {
      setIsNormalizing(false);
    }
  };

  // Category Filter Handlers
  const allCategories = useMemo(() => {
    return analysis ? analysis.distribution.map((d) => d.category) : [];
  }, [analysis]);

  const isAllSelected = useMemo(() => {
    return (
      allCategories.length > 0 &&
      selectedCategories.length === allCategories.length &&
      allCategories.every((c) => selectedCategories.includes(c))
    );
  }, [allCategories, selectedCategories]);

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...allCategories]);
    }
  };

  const handleToggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSelectAll = () => {
    setSelectedCategories([...allCategories]);
  };

  const handleClearFilter = () => {
    setSelectedCategories([]);
  };

  // Filtered Analytical View Calculations
  const filteredDistribution = useMemo(() => {
    if (!analysis) return [];
    return analysis.distribution.filter((d) => selectedCategories.includes(d.category));
  }, [analysis, selectedCategories]);

  const filteredTotalObservations = useMemo(() => {
    return filteredDistribution.reduce((acc, d) => acc + d.count, 0);
  }, [filteredDistribution]);

  const totalObservations = useMemo(() => {
    return analysis ? analysis.total_valid_count : 0;
  }, [analysis]);

  // Proportions strictly relative to filtered total
  const filteredDistributionWithPercentages = useMemo(() => {
    return filteredDistribution.map((d) => ({
      ...d,
      percentage:
        filteredTotalObservations > 0
          ? Number(((d.count / filteredTotalObservations) * 100).toFixed(2))
          : 0,
    }));
  }, [filteredDistribution, filteredTotalObservations]);

  const dominantCat = useMemo(() => {
    return filteredDistributionWithPercentages.length > 0
      ? filteredDistributionWithPercentages[0]
      : null;
  }, [filteredDistributionWithPercentages]);

  const leastCat = useMemo(() => {
    return filteredDistributionWithPercentages.length > 0
      ? filteredDistributionWithPercentages[filteredDistributionWithPercentages.length - 1]
      : null;
  }, [filteredDistributionWithPercentages]);

  const dynamicInterpretation = useMemo(() => {
    if (!analysis || filteredDistributionWithPercentages.length === 0) {
      return `No categories selected in the category filter. Select one or more categories above to display dynamic frequency counts and automated interpretation.`;
    }

    const topCatName = dominantCat ? dominantCat.category : 'N/A';
    const topPct = dominantCat ? dominantCat.percentage : 0;
    const topCnt = dominantCat ? dominantCat.count : 0;

    let text = isAllSelected
      ? `'${topCatName}' is the dominant category, representing ${topPct}% (${topCnt} observations) of the data.`
      : `'${topCatName}' is the dominant category among the selected ${selectedCol} representations, representing ${topPct}% (${topCnt} observations) of the filtered observations.`;

    if (
      dominantCat &&
      leastCat &&
      dominantCat.category !== leastCat.category &&
      dominantCat.count / Math.max(leastCat.count, 1) > 3
    ) {
      text += ` Noticeable disparity compared to '${leastCat.category}' (${leastCat.count} observations).`;
    }

    return text;
  }, [analysis, filteredDistributionWithPercentages, dominantCat, leastCat, isAllSelected, selectedCol]);

  if (catCols.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        No categorical features detected in the active dataset.
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
              <PieIcon className="w-6 h-6 text-purple-600" />
              Categorical Variable Analysis
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
              df['col'].value_counts()
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Examine discrete frequency tables, modal category proportions, and class distribution charts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Data Source Switch (Raw Data vs Cleaned Data) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleToggleUseRaw(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                !useRaw
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Cleaned Data (Active)
            </button>
            <button
              onClick={() => handleToggleUseRaw(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                useRaw
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              Raw Data (Original)
            </button>
          </div>

          {/* Feature Selector Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {catCols.map((c) => (
              <button
                key={c}
                onClick={() => handleSelectCol(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCol === c
                    ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <BackendErrorCard
          error={error}
          onRetry={() => loadColAnalysis(selectedCol, useRaw)}
          isRetrying={loading}
          featureName={`categorical analysis for '${selectedCol}'`}
        />
      ) : loading || !analysis ? (
        <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
          <span>Analyzing categories...</span>
        </div>
      ) : (
        <>
          {/* Inconsistency Detection Banner if column has multiple casing/whitespace representations */}
          {analysis.distribution.length > new Set(analysis.distribution.map((d) => d.category.trim().toLowerCase())).size && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Formatting Inconsistencies Detected in '{selectedCol}'
                </h4>
                <p className="text-amber-800 dark:text-amber-300 mt-0.5">
                  Multiple text representations ({analysis.distribution.slice(0, 8).map((d) => `"${d.category}"`).join(', ')}) represent the same underlying category, splintering frequency counts.
                </p>
              </div>
              <button
                onClick={handleNormalizeCurrent}
                disabled={isNormalizing}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shrink-0 shadow-xs transition-colors"
              >
                {isNormalizing ? "Standardizing..." : `Normalize Categorical Values`}
              </button>
            </div>
          )}

          {/* Normalization Success Alert */}
          {normalizeSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-2">
              <span>✓ Categorical entries in '{selectedCol}' successfully standardized into canonical format (Raw data preserved intact).</span>
            </div>
          )}

          {/* CATEGORY FILTER CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Category Filter
                  </h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    {selectedCategories.length} of {allCategories.length} selected
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select categories to include in the analysis
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                  Select All
                </button>
                <button
                  onClick={handleClearFilter}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Clear
                </button>
              </div>
            </div>

            {/* Checkbox multi-select items */}
            <div className="flex flex-wrap gap-2.5">
              {/* All Categories Pill */}
              <label
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  isAllSelected
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-2xs"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                />
                <span>All Categories</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-purple-700 dark:text-purple-300">
                  {analysis.distribution.length}
                </span>
              </label>

              {/* Dynamic Column Categories */}
              {analysis.distribution.map((item) => {
                const isChecked = selectedCategories.includes(item.category);
                return (
                  <label
                    key={item.category}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isChecked
                        ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-2xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCategory(item.category)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="font-mono font-bold">"{item.category}"</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.count}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* FILTERED RECORDS SUMMARY */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs px-4 py-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400">
                Showing:
              </span>
              <span className="font-black text-purple-600 dark:text-purple-400 font-mono">
                {filteredDistribution.length} of {allCategories.length} categories
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {filteredTotalObservations} of {totalObservations} observations
              </span>
            </div>
            {selectedCategories.length < allCategories.length && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Analytical filter active • Raw & Cleaned datasets remain completely intact
              </span>
            )}
          </div>

          {/* DYNAMIC AUTOMATED STATISTICAL INTERPRETATION */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-900/40 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-300 mb-1">
              <Info className="w-4 h-4 text-purple-600" />
              Automated Statistical Interpretation
            </div>
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              {dynamicInterpretation}
            </p>
          </div>

          {/* Key Metrics Cards (React to filter) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Distinct Categories</span>
              <span className="text-2xl font-black text-purple-600 block mt-1">
                {filteredDistribution.length}
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedCategories.length < allCategories.length ? `Filtered from ${allCategories.length}` : 'Unique levels in view'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Top Category (Mode)</span>
              <span className="text-2xl font-black text-indigo-600 block mt-1 truncate">
                {dominantCat ? dominantCat.category : 'N/A'}
              </span>
              <span className="text-[11px] text-slate-500">
                {dominantCat ? `${dominantCat.count} records (${dominantCat.percentage}%)` : '0 records'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Least Frequent Category</span>
              <span className="text-2xl font-black text-slate-700 dark:text-slate-300 block mt-1 truncate">
                {leastCat ? leastCat.category : 'N/A'}
              </span>
              <span className="text-[11px] text-slate-500">
                {leastCat ? `${leastCat.count} records (${leastCat.percentage}%)` : '0 records'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Observations</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {filteredTotalObservations}
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedCategories.length < allCategories.length ? `Filtered (total ${totalObservations})` : 'Non-null records'}
              </span>
            </div>
          </div>

          {/* CHARTS ROW (Reacts strictly to filter) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Frequency Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Frequency Distribution Bar Chart
                </h3>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                  {filteredDistribution.length} bar{filteredDistribution.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-64 w-full">
                {filteredDistributionWithPercentages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No categories selected. Check one or more categories above.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={filteredDistributionWithPercentages}
                      margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="category" angle={-20} textAnchor="end" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Frequency" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Proportion Donut Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Category Proportions Donut Chart
                </h3>
                <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {filteredDistribution.length} segment{filteredDistribution.length !== 1 ? 's' : ''} (100% total)
                </span>
              </div>
              <div className="h-64 w-full">
                {filteredDistributionWithPercentages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No categories selected. Check one or more categories above.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredDistributionWithPercentages}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        label={(entry: any) => `${entry.category || entry.name || ''} (${entry.percentage || ''}%)`}
                      >
                        {filteredDistributionWithPercentages.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* DETAILED FREQUENCY TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Discrete Frequency Table (Filtered View)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3.5">Category</th>
                    <th className="py-2.5 px-3.5">Count</th>
                    <th className="py-2.5 px-3.5">Proportion in Selection (%)</th>
                    <th className="py-2.5 px-3.5">Visual Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDistributionWithPercentages.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No categories currently selected.
                      </td>
                    </tr>
                  ) : (
                    filteredDistributionWithPercentages.map((d) => (
                      <tr key={d.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white font-mono">{d.category}</td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">{d.count}</td>
                        <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{d.percentage}%</td>
                        <td className="py-2.5 px-3.5 w-1/3">
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${d.percentage}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational Explanation for Teacher Evaluation */}
          <ExplanationCard explanation={explanation} />
        </>
      )}
    </div>
  );
};
