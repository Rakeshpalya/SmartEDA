import React, { useState, useEffect } from 'react';
import {
  X, ChevronLeft, ChevronRight, Presentation, Mic, Sparkles, CheckCircle2
} from 'lucide-react';
import { PresentationSlide } from '../types';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: PresentationSlide[];
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  slides,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentIdx((prev) => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIdx((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, slides.length, onClose]);

  if (!isOpen || slides.length === 0) return null;

  const slide = slides[currentIdx];
  const progressPct = Math.round(((currentIdx + 1) / slides.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 transition-opacity">
      {/* Presentation Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Slide Header */}
        <div className="p-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                VTU BAD702 Viva Presentation
              </span>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                10-Minute Project Defense Deck
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-slate-500">
              Slide {currentIdx + 1} of {slides.length} ({progressPct}%)
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Slide Body */}
        <div className="flex-1 p-6 sm:p-10 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                Slide {slide.slide_number}
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white mt-3 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 mt-1 font-medium">
                {slide.subtitle}
              </p>
            </div>

            {/* Metrics cards if any */}
            {slide.metrics && slide.metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-6">
                {slide.metrics.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40"
                  >
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block uppercase">
                      {m.label}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5 block">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Bullet Points */}
            <div className="space-y-3.5 my-6">
              {slide.bullet_points.map((pt, pIdx) => (
                <div key={pIdx} className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-base text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Presenter Notes */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              <Mic className="w-4 h-4 text-amber-600" />
              Presenter Viva Notes (What to say to your teacher):
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
              "{slide.presenter_notes}"
            </p>
          </div>
        </div>

        {/* Slide Navigation Footer */}
        <div className="p-4 sm:px-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <button
            onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Press Arrow Keys (← / →) to navigate
          </span>

          <button
            onClick={() => setCurrentIdx((p) => Math.min(slides.length - 1, p + 1))}
            disabled={currentIdx === slides.length - 1}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-all"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
