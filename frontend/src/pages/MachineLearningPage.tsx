import React, { useState, useEffect } from 'react';
import {
  Cpu, Award, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, BarChart2,
  Table, HelpCircle, Layers, Play
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { DatasetSummary, MLTrainResponse, EvaluatedModel } from '../types';

export const MachineLearningPage: React.FC = () => {
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [problemType, setProblemType] = useState<'classification' | 'regression'>('classification');
  const [testSize, setTestSize] = useState<number>(0.20);
  const [scalingMethod, setScalingMethod] = useState<string>('standard');
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>([
    'random_forest', 'logistic_regression', 'decision_tree'
  ]);
  const [candidateModels, setCandidateModels] = useState<any[]>([]);
  const [results, setResults] = useState<MLTrainResponse | null>(null);
  const [selectedModelView, setSelectedModelView] = useState<EvaluatedModel | null>(null);
  const [isTraining, setIsTraining] = useState(false);

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
      loadCandidates(initialType);
    });
  }, []);

  const loadCandidates = async (pType: string) => {
    try {
      const candidates = await api.getCandidateModels(pType);
      setCandidateModels(candidates as any[]);
      if (pType === 'classification') {
        setSelectedAlgos(['random_forest', 'logistic_regression', 'decision_tree', 'gradient_boosting']);
      } else {
        setSelectedAlgos(['random_forest', 'linear_regression', 'gradient_boosting', 'decision_tree']);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProblemTypeChange = (pType: 'classification' | 'regression') => {
    setProblemType(pType);
    loadCandidates(pType);
    setResults(null);
  };

  const handleToggleAlgo = (algoId: string) => {
    setSelectedAlgos((prev) =>
      prev.includes(algoId)
        ? prev.filter((a) => a !== algoId)
        : [...prev, algoId]
    );
  };

  const handleTrain = async () => {
    if (!selectedTarget || selectedAlgos.length === 0) {
      alert("Please select at least one algorithm and a target feature.");
      return;
    }
    setIsTraining(true);
    try {
      const res = await api.trainModels({
        target_column: selectedTarget,
        problem_type: problemType,
        algorithms: selectedAlgos,
        test_size: testSize,
        scaling_method: scalingMethod,
        encoding_method: 'onehot',
        random_state: 42,
      });
      setResults(res);
      if (res.models_evaluated.length > 0) {
        setSelectedModelView(res.models_evaluated[0]);
      }
      // Trigger celebration confetti
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      } catch {
        // ignore
      }
    } catch (e: any) {
      alert(`Model training error: ${e.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-600" />
              Machine Learning Training & Comparative Evaluation
            </h2>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
              Scikit-Learn Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fit multiple candidate algorithms, extract feature importances, and benchmark test metrics.
          </p>
        </div>
      </div>

      {/* Configuration Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
          Training Configuration & Algorithm Selection
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Target Column */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Target Column
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-bold"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Problem Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Problem Type
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => handleProblemTypeChange('classification')}
                className={`w-1/2 py-1.5 rounded-lg transition-all ${
                  problemType === 'classification'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                Classification
              </button>
              <button
                onClick={() => handleProblemTypeChange('regression')}
                className={`w-1/2 py-1.5 rounded-lg transition-all ${
                  problemType === 'regression'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                Regression
              </button>
            </div>
          </div>

          {/* Train/Test Split */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Train / Test Split Ratio
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTestSize(0.30)}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  testSize === 0.30
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                70 / 30
              </button>
              <button
                onClick={() => setTestSize(0.20)}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  testSize === 0.20
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                80 / 20 (Standard)
              </button>
              <button
                onClick={() => setTestSize(0.10)}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  testSize === 0.10
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                90 / 10
              </button>
            </div>
          </div>
        </div>

        {/* Algorithm Checkboxes */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Candidate Machine Learning Algorithms to Benchmark
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {candidateModels.map((algo) => {
              const isSelected = selectedAlgos.includes(algo.id);
              return (
                <div
                  key={algo.id}
                  onClick={() => handleToggleAlgo(algo.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {algo.name}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-indigo-600"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                    {algo.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Train Button */}
        <button
          onClick={handleTrain}
          disabled={isTraining || selectedAlgos.length === 0}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 shadow-sm transition-all flex items-center justify-center gap-2"
        >
          {isTraining ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Training & Benchmarking Selected Algorithms...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Train & Benchmark Candidate Models ({selectedAlgos.length} Selected)
            </>
          )}
        </button>
      </div>

      {/* Model Benchmark Results */}
      {results && (
        <div className="space-y-6">
          {/* Recommendation Champion Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                  Champion Model Recommended
                </span>
                <h3 className="text-2xl font-black">
                  {results.recommended_model}
                </h3>
                <p className="text-xs text-emerald-50 mt-1 max-w-3xl leading-relaxed font-medium">
                  {results.recommendation_reason}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs font-mono text-emerald-100">
                  <span>Random State: {results.split_info.random_state}</span>
                  <span>•</span>
                  <span>Train Set: {results.split_info.train_samples} samples</span>
                  <span>•</span>
                  <span>Test Set: {results.split_info.test_samples} samples</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Comparison Benchmark Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
              Algorithm Benchmark Comparison Table
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3.5">Algorithm</th>
                    <th className="py-2.5 px-3.5">Training Time</th>
                    <th className="py-2.5 px-3.5">Train Score</th>
                    <th className="py-2.5 px-3.5">Test Score</th>
                    {results.problem_type === 'classification' ? (
                      <>
                        <th className="py-2.5 px-3.5">Accuracy</th>
                        <th className="py-2.5 px-3.5">Precision</th>
                        <th className="py-2.5 px-3.5">Recall</th>
                        <th className="py-2.5 px-3.5">F1-Score</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3.5">R² Score</th>
                        <th className="py-2.5 px-3.5">MAE</th>
                        <th className="py-2.5 px-3.5">RMSE</th>
                      </>
                    )}
                    <th className="py-2.5 px-3.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {results.models_evaluated.map((m) => {
                    const isRec = m.algorithm === results.recommended_algorithm;
                    return (
                      <tr
                        key={m.algorithm}
                        className={`hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 ${
                          isRec ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3.5 font-bold font-sans text-slate-900 dark:text-white flex items-center gap-1.5">
                          {m.model_name}
                          {isRec && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-sans">
                              BEST
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500">{m.training_time_ms} ms</td>
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400">{m.train_score}</td>
                        <td className="py-2.5 px-3.5 font-bold text-indigo-600 dark:text-indigo-400">{m.test_score}</td>
                        {results.problem_type === 'classification' ? (
                          <>
                            <td className="py-2.5 px-3.5">{m.accuracy ? `${(m.accuracy * 100).toFixed(1)}%` : '-'}</td>
                            <td className="py-2.5 px-3.5">{m.precision ? `${(m.precision * 100).toFixed(1)}%` : '-'}</td>
                            <td className="py-2.5 px-3.5">{m.recall ? `${(m.recall * 100).toFixed(1)}%` : '-'}</td>
                            <td className="py-2.5 px-3.5 font-bold text-purple-600">{m.f1_score ? `${(m.f1_score * 100).toFixed(1)}%` : '-'}</td>
                          </>
                        ) : (
                          <>
                            <td className="py-2.5 px-3.5 font-bold text-purple-600">{m.r2_score}</td>
                            <td className="py-2.5 px-3.5">{m.mae}</td>
                            <td className="py-2.5 px-3.5">{m.rmse}</td>
                          </>
                        )}
                        <td className="py-2.5 px-3.5 font-sans">
                          <button
                            onClick={() => setSelectedModelView(m)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Dive on Selected Model (Feature Importance & Confusion Matrix) */}
          {selectedModelView && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feature Importance Horizontal Bar Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                  Feature Importance ({selectedModelView.model_name})
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Shows relative mathematical contribution of features in predictive splits.
                </p>

                {selectedModelView.feature_importances && selectedModelView.feature_importances.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedModelView.feature_importances.map((f) => (
                      <div key={f.feature}>
                        <div className="flex items-center justify-between text-xs font-medium mb-1">
                          <span className="font-mono text-slate-800 dark:text-slate-200">{f.feature}</span>
                          <span className="font-bold text-indigo-600">{(f.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.min(100, f.importance * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Feature importances not natively exposed for this algorithm type.
                  </div>
                )}
              </div>

              {/* Confusion Matrix (Classification) or Residual Summary (Regression) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                {selectedModelView.confusion_matrix && selectedModelView.classes ? (
                  <>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                      Test Confusion Matrix ({selectedModelView.model_name})
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      True rows vs Predicted columns on unseen evaluation samples.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr>
                            <th className="p-2 text-left font-bold text-slate-400">Actual \ Predicted</th>
                            {selectedModelView.classes.map((c) => (
                              <th key={c} className="p-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedModelView.confusion_matrix.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="p-2 text-left font-mono font-bold text-slate-800 dark:text-slate-200">
                                {selectedModelView.classes![rIdx]}
                              </td>
                              {row.map((cellVal, cIdx) => (
                                <td key={cIdx} className="p-1.5">
                                  <div
                                    className={`w-16 h-12 mx-auto flex items-center justify-center rounded-xl font-mono text-xs font-bold ${
                                      rIdx === cIdx
                                        ? 'bg-emerald-600 text-white'
                                        : cellVal > 0
                                        ? 'bg-rose-500/80 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {cellVal}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                      Regression Performance Metrics
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">R² Coefficient</span>
                        <span className="text-2xl font-black text-indigo-600 block mt-1">{selectedModelView.r2_score}</span>
                        <span className="text-[10px] text-slate-500">Proportion of variance explained</span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border">
                        <span className="text-[11px] font-bold text-slate-400 uppercase">RMSE</span>
                        <span className="text-2xl font-black text-purple-600 block mt-1">{selectedModelView.rmse}</span>
                        <span className="text-[10px] text-slate-500">Root Mean Squared Error</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
