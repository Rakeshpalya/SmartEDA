import React from 'react';
import { AlertCircle, HelpCircle, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';
import { OperationExplanation } from '../types';

interface ExplanationCardProps {
  explanation?: OperationExplanation | null;
  title?: string;
  defaultOpen?: boolean;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  explanation,
  title = "Educational EDA Explanation (Teacher Evaluation Requirement)",
}) => {
  if (!explanation) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-blue-50/50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl p-5 shadow-sm mt-4 transition-all">
      <div className="flex items-center gap-2 mb-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
        <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
          <HelpCircle className="w-4 h-4" />
        </div>
        <h4 className="font-semibold text-indigo-950 dark:text-indigo-200 text-sm tracking-wide">
          {title}
        </h4>
        <span className="ml-auto text-xs font-medium px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300 rounded-full">
          VTU BAD702 Criteria
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Step 1: Problem */}
        <div className="bg-white/90 dark:bg-slate-900/80 border border-rose-200/70 dark:border-rose-950/60 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              1. Problem Found
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {explanation.problem}
            </p>
          </div>
          {explanation.before_count !== undefined && (
            <div className="mt-2.5 pt-2 border-t border-rose-100 dark:border-rose-950/50 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
              Before: {explanation.before_count}
            </div>
          )}
        </div>

        {/* Step 2: Why it matters */}
        <div className="bg-white/90 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-950/60 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              2. Why It Matters
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {explanation.why_it_matters}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100 dark:border-amber-950/50 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
            Statistical Impact
          </div>
        </div>

        {/* Step 3: Technique */}
        <div className="bg-white/90 dark:bg-slate-900/80 border border-blue-200/70 dark:border-blue-950/60 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Wrench className="w-3.5 h-3.5" />
              3. Technique Used
            </div>
            <p className="text-xs font-mono bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 p-1.5 rounded border border-blue-100 dark:border-blue-900/40 break-words text-[11px]">
              {explanation.technique}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-100 dark:border-blue-950/50 text-[11px] text-blue-700 dark:text-blue-300 font-medium">
            Standard Python / Pandas
          </div>
        </div>

        {/* Step 4: What Changed */}
        <div className="bg-white/90 dark:bg-slate-900/80 border border-purple-200/70 dark:border-purple-950/60 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              4. What Changed
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {explanation.what_changed}
            </p>
          </div>
          {explanation.after_count !== undefined && (
            <div className="mt-2.5 pt-2 border-t border-purple-100 dark:border-purple-950/50 text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
              After: {explanation.after_count}
            </div>
          )}
        </div>

        {/* Step 5: Improvement Reason */}
        <div className="bg-white/90 dark:bg-slate-900/80 border border-emerald-200/70 dark:border-emerald-950/60 rounded-xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              5. Dataset Improvement
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {explanation.improvement_reason}
            </p>
          </div>
          <div className="mt-2.5 pt-2 border-t border-emerald-100 dark:border-emerald-950/50 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
            Higher Quality Data
          </div>
        </div>
      </div>
    </div>
  );
};
