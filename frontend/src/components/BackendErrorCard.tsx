import React from 'react';
import { AlertTriangle, RefreshCw, Server, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface BackendErrorCardProps {
  error?: string | null;
  onRetry: () => void;
  isRetrying?: boolean;
  featureName?: string;
}

export const BackendErrorCard: React.FC<BackendErrorCardProps> = ({
  error,
  onRetry,
  isRetrying = false,
  featureName = 'analysis backend',
}) => {
  return (
    <div className="my-8 max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-md text-center space-y-4">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
        <AlertTriangle className="w-7 h-7" />
      </div>

      {/* Main Headings */}
      <div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          Backend Connection Error
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
          SmartEDA frontend is running, but the {featureName} could not be reached.
        </p>
      </div>

      {/* Detailed Technical Note */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-0.5">
            Error Details
          </span>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 break-words">
            {error}
          </p>
        </div>
      )}

      {/* API Endpoint Indicator */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
        <Server className="w-3.5 h-3.5 text-purple-600 shrink-0" />
        <span>Configured API Base:</span>
        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold truncate max-w-xs">
          {API_BASE_URL}
        </code>
      </div>

      {/* Retry Action */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Connecting to Backend...' : 'Retry Connection'}
        </button>
      </div>

      {/* Helpful Deployment Hints */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-left text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700 dark:text-slate-300">Troubleshooting:</p>
        <ul className="list-disc list-inside space-y-0.5 text-slate-500">
          <li><strong>Local development:</strong> Ensure FastAPI is running on <code>http://127.0.0.1:8000</code>.</li>
          <li><strong>Netlify production:</strong> In Netlify Site Settings &rarr; Environment variables, set <code>VITE_API_BASE_URL</code> to your public backend URL (e.g. Render/Railway).</li>
        </ul>
      </div>
    </div>
  );
};
