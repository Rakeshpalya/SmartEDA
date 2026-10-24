import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Server, Check, ShieldAlert, Globe } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

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
  const [inputUrl, setInputUrl] = useState<string>(getApiBaseUrl());
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveAndConnect = (urlToSave?: string) => {
    const target = (urlToSave || inputUrl).trim();
    if (!target) return;
    setApiBaseUrl(target);
    setInputUrl(target);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRetry();
  };

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  return (
    <div className="my-8 max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-xl text-center space-y-5">
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
        <AlertTriangle className="w-7 h-7" />
      </div>

      {/* Main Headings */}
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Backend Connection Required
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-lg mx-auto leading-relaxed">
          The SmartEDA frontend is live, but it needs to connect to the Python FastAPI backend to perform dataset calculations and train models.
        </p>
      </div>

      {/* Mixed Content Browser Security Notice if visited on HTTPS */}
      {isHttps && inputUrl.startsWith('http://') && (
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-left text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Browser Mixed Content Notice (HTTPS &rarr; HTTP):</p>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300">
              You are viewing this site over <strong>HTTPS</strong>, so Chrome blocks requests to unencrypted <code>http://127.0.0.1:8000</code> by default.
            </p>
            <div className="pt-1 text-[11px] font-medium text-amber-900 dark:text-amber-100">
              💡 <strong>Quick Fix in Chrome:</strong> Click the <strong>tune/lock icon</strong> on the left side of the address bar &rarr; <strong>Site settings</strong> &rarr; Set <strong>Insecure content</strong> to <strong>Allow</strong> &rarr; Refresh page.
            </div>
          </div>
        </div>
      )}

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

      {/* Interactive Backend URL Configuration */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          FastAPI Backend Server URL:
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. https://your-backend.onrender.com or http://127.0.0.1:8000"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={() => handleSaveAndConnect()}
            disabled={isRetrying}
            className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />}
            {isRetrying ? 'Connecting...' : savedSuccess ? 'Saved!' : 'Save & Connect'}
          </button>
        </div>

        {/* Quick URL Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600 dark:text-slate-400">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleSaveAndConnect('https://smarteda-rakesh.loca.lt')}
            className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold hover:bg-emerald-200 transition cursor-pointer flex items-center gap-1"
          >
            <Globe className="w-3 h-3" />
            HTTPS Tunnel (Live)
          </button>
          <button
            type="button"
            onClick={() => handleSaveAndConnect('http://127.0.0.1:8000')}
            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-mono hover:bg-slate-300 transition cursor-pointer"
          >
            http://127.0.0.1:8000
          </button>
        </div>
      </div>

      {/* Troubleshooting List */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-left text-[11px] text-slate-500 space-y-1.5">
        <p className="font-bold text-slate-700 dark:text-slate-300">How to run the backend:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
          <li><strong>Option 1 (Local):</strong> Run <code>python -m uvicorn app.main:app --port 8000</code> in the <code>backend/</code> folder.</li>
          <li><strong>Option 2 (Local Web App):</strong> Open <a href="http://localhost:5173" className="text-purple-600 underline font-semibold" target="_blank" rel="noreferrer">http://localhost:5173</a> for full local access without mixed-content browser restrictions.</li>
          <li><strong>Option 3 (Free Cloud Hosting):</strong> Deploy the <code>backend/</code> folder to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-purple-600 underline font-semibold">Render.com</a> (using <code>render.yaml</code>) for an HTTPS endpoint.</li>
        </ul>
      </div>
    </div>
  );
};
