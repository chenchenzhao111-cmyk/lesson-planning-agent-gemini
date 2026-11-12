import React from 'react';
import { Sparkles, BookOpen, Clock, Cpu, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onNewPlan: () => void;
  onOpenPresets: () => void;
  onOpenFramework: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewPlan,
  onOpenPresets,
  onOpenFramework,
  hasApiKey,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <a
              href="/"
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 block leading-tight hover:text-blue-600 transition-colors"
            >
              Lesson Planning Agent
            </a>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span>Version 3.5</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-blue-600">
                <Sparkles className="w-3 h-3" />
                LLM Powered
              </span>
            </div>
          </div>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={onNewPlan}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 text-slate-800 font-semibold"
          >
            Plan Builder
          </button>
          <button
            onClick={onOpenPresets}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            Sample Lessons
          </button>
          <button
            onClick={onOpenFramework}
            className="hover:text-blue-600 transition-colors whitespace-nowrap shrink-0"
          >
            Pedagogical Rules
          </button>
          <div className="flex items-center gap-1 text-xs text-slate-400 border-l border-slate-200 pl-4 py-0.5 whitespace-nowrap">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Engine: {hasApiKey ? 'Gemini 3.8 Flash' : 'V3 Rules Offline'}</span>
          </div>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onNewPlan}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-600/20 whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <span>+ New Plan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
