import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { QualityBreakdownItem } from '../types';

interface HealthScoreCardProps {
  score: number;
  grade: string;
  breakdown: QualityBreakdownItem[];
  onNavigateToSection?: (section: string) => void;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  score,
  grade,
  breakdown,
  onNavigateToSection,
}) => {
  // Determine color scheme
  let ringColor = "text-emerald-500";
  let bgBadge = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
  let Icon = ShieldCheck;

  if (score < 60) {
    ringColor = "text-rose-500";
    bgBadge = "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300";
    Icon = ShieldAlert;
  } else if (score < 80) {
    ringColor = "text-amber-500";
    bgBadge = "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    Icon = AlertTriangle;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`${ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {score}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Dataset Health Score
              </h3>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${bgBadge}`}>
                {grade}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Calculated dynamically using data completeness, deduplication, statistical validity, and format integrity.
            </p>
          </div>
        </div>

        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Icon className="w-4 h-4 text-slate-400" />
            <span>Target: 100/100</span>
          </div>
          <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            View Scoring Formula →
          </span>
        </div>
      </div>

      {/* Deduction Breakdown */}
      <div className="mt-5">
        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Score Breakdown & Deductions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {breakdown.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                item.deduction > 0
                  ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                  : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {item.factor}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {item.detail}
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                {item.deduction > 0 ? (
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    -{item.deduction} pts
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    0 deduction
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
