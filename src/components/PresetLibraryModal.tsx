import React from 'react';
import { X, BookOpen, Clock, Users, ArrowRight, Sparkles } from 'lucide-react';
import { PRESET_LESSONS, PresetLesson } from '../data/presets';
import { TeachingSetting } from '../types/lesson';

interface PresetLibraryModalProps {
  onSelect: (preset: PresetLesson) => void;
  onClose: () => void;
}

export const PresetLibraryModal: React.FC<PresetLibraryModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 no-print">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Curriculum Sample Library</h3>
              <p className="text-xs text-slate-500">Pre-configured lessons across disciplines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {PRESET_LESSONS.map((preset) => (
              <div
                key={preset.name}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all bg-white flex flex-col justify-between group cursor-pointer"
                onClick={() => {
                  onSelect(preset);
                  onClose();
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      {preset.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {preset.duration} min · {preset.setting}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors mb-1">
                    {preset.name}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="truncate max-w-[200px] text-slate-400 text-[11px]">
                    {preset.audience}
                  </span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Load
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
